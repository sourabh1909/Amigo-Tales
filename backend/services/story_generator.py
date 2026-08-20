import json
import logging
import numpy as np
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from core.config import settings
from models.story import Story, StoryNode

logger = logging.getLogger("story_generator")

# Limit story progression to 6 decision levels before resolving to an ending
MAX_STORY_DEPTH = 6

# Cache the MiniLM embedding model instance in memory
_embedding_model = None

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading all-MiniLM-L6-v2 embedding model...")
            _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("all-MiniLM-L6-v2 embedding model loaded successfully.")
        except Exception as e:
            logger.error(f"Error loading sentence-transformers model: {e}")
            _embedding_model = False
    return _embedding_model if _embedding_model is not False else None


def fallback_similarity(text1: str, text2: str) -> float:
    if not text1 or not text2:
        return 0.0
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    return len(intersection) / len(union) if union else 0.0


def compute_cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    if vec1 is None or vec2 is None:
        return 0.0
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(vec1, vec2) / (norm1 * norm2))


def get_story_path(db: Session, story: Story, current_node: StoryNode) -> str:
    """
    Reconstructs the story path from root to the current node by walking
    backwards through the story tree. Returns a formatted narrative summary
    for the AI to continue the story coherently.
    """
    all_nodes = db.query(StoryNode).filter(StoryNode.story_id == story.id).all()
    
    # Map child node IDs back to parent nodes and selected options
    child_to_parent = {}
    node_map = {}
    for node in all_nodes:
        node_map[node.id] = node
        if node.options:
            for opt in node.options:
                child_id = opt.get("node_id")
                if child_id:
                    child_to_parent[child_id] = {
                        "parent_id": node.id,
                        "choice_text": opt.get("text", "")
                    }
    
    # Trace the route from current node up to the root
    path_segments = []
    walk_id = current_node.id
    while walk_id in child_to_parent:
        info = child_to_parent[walk_id]
        parent = node_map.get(info["parent_id"])
        if parent:
            path_segments.append({
                "passage": parent.content[:200],
                "choice_made": info["choice_text"]
            })
        walk_id = info["parent_id"]
    
    path_segments.reverse()
    
    if not path_segments:
        return ""
    
    # Build contextual narrative history for LLM continuation
    story_so_far = "STORY SO FAR:\n"
    for i, seg in enumerate(path_segments):
        story_so_far += f"Chapter {i + 1}: {seg['passage']}\n"
        story_so_far += f"→ Player chose: \"{seg['choice_made']}\"\n\n"
    
    return story_so_far


def generate_groq_story(
    db: Session, 
    theme: str, 
    session_id: str, 
    target_ending: Optional[str] = None
) -> Story:
    """
    Generates an interactive adventure story using Groq API.
    Creates root node with 2 choices. Story continues dynamically
    as user picks options, building a deep binary tree (5-6 levels).
    """
    model = get_embedding_model()
    target_ending_vec = None
    if model and target_ending:
        try:
            target_ending_vec = model.encode(target_ending)
        except Exception as e:
            logger.error(f"Error encoding target ending: {e}")

    # Prompt Groq API for the opening passage with 2 choices
    story_json = None
    if settings.GROQ_API_KEY:
        try:
            import groq
            client = groq.Groq(api_key=settings.GROQ_API_KEY)

            prompt = f"""
You are an expert interactive fiction writer and game designer.
Create the OPENING of an exciting Choose Your Own Adventure story based on the theme: "{theme}".

IMPORTANT RULES:
- Write a rich, immersive opening passage (5-8 sentences) that sets up the world, atmosphere, and the protagonist's situation.
- Provide exactly 2 distinct choices that lead the story in VERY different directions.
- Each choice's "next_passage" should be 4-6 sentences long, vivid, and end at a new decision point.
- Do NOT end the story yet. Both choices should continue the adventure — this is just the beginning.
- Make both options equally compelling and dramatically different from each other.

Return ONLY a valid JSON object:
{{
  "title": "A compelling story title",
  "description": "Brief one-line description",
  "root_node": {{
    "content": "Rich 5-8 sentence opening passage...",
    "choices": [
      {{
        "text": "A clear action the player can take...",
        "next_passage": "4-6 sentence passage that continues the story and ends at a new decision point..."
      }},
      {{
        "text": "A completely different action...",
        "next_passage": "4-6 sentence passage that takes the story in a different direction..."
      }}
    ]
  }}
}}"""

            groq_models = [
                "groq/compound",
                "groq/compound-mini",
                "qwen/qwen3.6-27b",
                "openai/gpt-oss-120b",
                "openai/gpt-oss-20b",
                "llama-3.3-70b-versatile",
                "llama-3.1-8b-instant"
            ]

            for model_name in groq_models:
                try:
                    logger.info(f"Attempting Groq completion with model: {model_name}")
                    completion = client.chat.completions.create(
                        model=model_name,
                        messages=[
                            {"role": "system", "content": "You output strictly valid JSON without markdown code fences or explanatory text. Write rich, immersive, cinematic narrative passages."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.8,
                        max_tokens=4096,
                        response_format={"type": "json_object"}
                    )
                    raw_response = completion.choices[0].message.content
                    story_json = json.loads(raw_response)
                    logger.info(f"Successfully generated story using Groq model '{model_name}'!")
                    break
                except Exception as model_err:
                    logger.warning(f"Groq model {model_name} failed: {model_err}")
                    continue
        except Exception as e:
            logger.error(f"Groq API error during story generation: {e}")

    # Fallback structure if Groq API fails
    if not story_json:
        story_json = {
            "title": f"The {theme.title()} Quest",
            "description": f"An epic adventure into the unknown.",
            "root_node": {
                "content": f"You stand at the threshold of a grand adventure centered around '{theme}'. The air crackles with possibility as you survey the landscape before you. Ancient paths diverge in two directions, each promising a different fate. A weathered signpost stands at the fork — one arrow points toward dark mountains shrouded in mist, the other toward a shimmering coastline. Your heart races as you realize that this single choice will shape everything that follows.",
                "choices": [
                    {
                        "text": "Take the mountain path into the misty highlands",
                        "next_passage": "You ascend the rocky trail as fog wraps around you like a living thing. The temperature drops with each step, and strange sounds echo from somewhere deep within the mountains. After an hour of climbing, you discover a cave entrance carved with ancient runes that seem to glow faintly in the dim light. Inside, you can hear the distant sound of running water and something else — a low, rhythmic chanting.",
                    },
                    {
                        "text": "Follow the coastal path toward the shimmering shore",
                        "next_passage": "The path winds downhill through wildflower meadows before opening onto a breathtaking coastline. Crystal-clear waves crash against weathered cliffs, and in the distance you spot a small fishing village with colorful boats bobbing in the harbor. As you approach the village, you notice something unusual — the streets are completely empty despite the boats being freshly moored. A single note pinned to the tavern door flutters in the sea breeze.",
                    }
                ]
            }
        }

    # 1. Create main story entry
    story = Story(
        title=story_json.get("title", f"The {theme.capitalize()} Quest"),
        session_id=session_id,
        description=story_json.get("description", f"Interactive story based on {theme}"),
        target_ending=target_ending
    )
    db.add(story)
    db.commit()
    db.refresh(story)

    # 2. Save root node (Chapter 1)
    root_data = story_json.get("root_node", {})
    root_node = StoryNode(
        story_id=story.id,
        content=root_data.get("content", f"Welcome to your adventure based on {theme}."),
        is_root=True,
        is_ending=False,
        is_winning=False,
        depth=0,
        options=[]
    )
    db.add(root_node)
    db.commit()
    db.refresh(root_node)

    # 3. Create initial branching child nodes (depth 1)
    raw_choices = root_data.get("choices", [])
    node_options = []

    for choice in raw_choices[:2]:
        choice_text = choice.get("text", "Continue forward")
        next_passage = choice.get("next_passage", "You continue on your path...")

        # Calculate semantic similarity against target ending vector if provided
        similarity_score = 0.0
        if model and target_ending_vec is not None:
            try:
                choice_vec = model.encode(choice_text)
                similarity_score = compute_cosine_similarity(choice_vec, target_ending_vec)
                logger.info(f"Option '{choice_text[:30]}' MiniLM similarity score: {similarity_score:.4f}")
            except Exception as e:
                logger.error(f"Error computing choice embedding similarity: {e}")

        child_node = StoryNode(
            story_id=story.id,
            content=next_passage,
            is_root=False,
            is_ending=False,
            is_winning=False,
            depth=1,
            options=[]
        )
        db.add(child_node)
        db.commit()
        db.refresh(child_node)

        node_options.append({
            "text": choice_text,
            "node_id": child_node.id,
            "similarity_score": round(similarity_score, 4)
        })

    # Link child branch IDs into the root node options
    root_node.options = node_options
    db.commit()
    db.refresh(story)

    return story


def continue_story_node(db: Session, story: Story, current_node: StoryNode) -> StoryNode:
    """
    Dynamically generates the next 2 choice options for a story node on-the-fly.
    Tracks depth so after MAX_STORY_DEPTH choices, the story reaches an ending.
    Feeds the full story path to the AI for coherent continuation.
    """
    if current_node.options or current_node.is_ending:
        return current_node

    current_depth = current_node.depth or 0
    is_near_ending = current_depth >= (MAX_STORY_DEPTH - 1)  # depth 5 = last choice round
    is_final = current_depth >= MAX_STORY_DEPTH  # depth 6+ = force ending

    # If we've exceeded max depth, mark as ending directly
    if is_final:
        current_node.is_ending = True
        current_node.is_winning = True
        db.commit()
        return current_node

    # Get the story path for context
    story_path = get_story_path(db, story, current_node)

    model = get_embedding_model()
    target_ending_vec = None
    if model and story.target_ending:
        try:
            target_ending_vec = model.encode(story.target_ending)
        except Exception as e:
            logger.error(f"Error encoding target ending: {e}")

    story_json = None
    if settings.GROQ_API_KEY:
        try:
            import groq
            client = groq.Groq(api_key=settings.GROQ_API_KEY)

            if is_near_ending:
                # This is the LAST choice — both options should lead to dramatic endings
                prompt = f"""
You are an expert interactive fiction writer.
Story Title: "{story.title}"

{story_path}
Current Scene (Chapter {current_depth + 1}): "{current_node.content}"

This is the FINAL decision point. The story must reach its conclusion after this choice.

IMPORTANT RULES:
- Provide exactly 2 choices that lead to DIFFERENT endings.
- One ending should be a triumphant victory, the other a bittersweet or dramatic conclusion.
- Each "next_passage" MUST be 5-8 sentences long — this is the story's FINALE, make it epic and satisfying.
- Wrap up all narrative threads. Give the reader a sense of closure.

Return ONLY a valid JSON object:
{{
  "choices": [
    {{
      "text": "The heroic final action...",
      "next_passage": "5-8 sentence triumphant ending passage...",
      "is_ending": true,
      "is_winning": true
    }},
    {{
      "text": "The risky alternative...",
      "next_passage": "5-8 sentence dramatic conclusion passage...",
      "is_ending": true,
      "is_winning": false
    }}
  ]
}}"""
            else:
                # Normal continuation — story is still building
                remaining = MAX_STORY_DEPTH - current_depth
                prompt = f"""
You are an expert interactive fiction writer.
Story Title: "{story.title}"

{story_path}
Current Scene (Chapter {current_depth + 1}): "{current_node.content}"

The story has approximately {remaining} more chapters before reaching its conclusion.

IMPORTANT RULES:
- Provide exactly 2 distinct choices that take the story in VERY different directions.
- Each "next_passage" should be 4-6 sentences long, vivid, immersive, and end at a new decision point.
- Do NOT end the story yet. Both choices should continue the adventure.
- Build tension and raise the stakes compared to previous chapters.
- Each choice should feel meaningful and lead to genuinely different story paths.
- Reference events from the story so far to maintain continuity.

Return ONLY a valid JSON object:
{{
  "choices": [
    {{
      "text": "A clear action the player can take...",
      "next_passage": "4-6 sentence passage continuing the story..."
    }},
    {{
      "text": "A completely different action...",
      "next_passage": "4-6 sentence passage taking a different direction..."
    }}
  ]
}}"""

            groq_models = [
                "groq/compound",
                "groq/compound-mini",
                "qwen/qwen3.6-27b",
                "openai/gpt-oss-120b",
                "openai/gpt-oss-20b",
                "llama-3.3-70b-versatile",
                "llama-3.1-8b-instant"
            ]

            for model_name in groq_models:
                try:
                    completion = client.chat.completions.create(
                        model=model_name,
                        messages=[
                            {"role": "system", "content": "You output strictly valid JSON without markdown code fences or explanatory text. Write rich, immersive, cinematic narrative passages that build on previous story events."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.8,
                        max_tokens=4096,
                        response_format={"type": "json_object"}
                    )
                    raw_response = completion.choices[0].message.content
                    story_json = json.loads(raw_response)
                    break
                except Exception:
                    continue
        except Exception as e:
            logger.error(f"Error calling Groq API for node continuation: {e}")

    # Fallback
    if not story_json or not story_json.get("choices"):
        if is_near_ending:
            story_json = {
                "choices": [
                    {
                        "text": "Make your triumphant final stand",
                        "next_passage": "With everything you've learned and every challenge you've overcome, you make your move. The world holds its breath as you face your greatest test. Against all odds, your determination proves stronger than any obstacle. Victory washes over you like a warm tide, and you know that every choice you made led to this perfect moment. The adventure is complete — and you emerged a hero.",
                        "is_ending": True,
                        "is_winning": True
                    },
                    {
                        "text": "Take the dangerous path of sacrifice",
                        "next_passage": "You choose the harder road, knowing it demands everything you have. The cost is steep, but sometimes the bravest choice is also the most painful. As the dust settles, you realize that while you didn't get the ending you imagined, the journey itself transformed you into something greater. The story ends not with triumph, but with hard-won wisdom and a quiet peace.",
                        "is_ending": True,
                        "is_winning": False
                    }
                ]
            }
        else:
            story_json = {
                "choices": [
                    {
                        "text": "Push forward with bold determination",
                        "next_passage": "With fire in your veins, you charge ahead into the unknown. The path narrows but your resolve only grows stronger. A clearing opens before you, revealing something extraordinary that changes everything you thought you knew about this place.",
                    },
                    {
                        "text": "Take a cautious approach and investigate",
                        "next_passage": "You move silently through the terrain, eyes scanning for any advantage. Your patience is rewarded when you discover a hidden passage that others have overlooked. Ancient markings on the walls hint at secrets that could alter the course of your journey.",
                    }
                ]
            }

    raw_choices = story_json.get("choices", [])
    node_options = []
    next_depth = current_depth + 1

    for choice in raw_choices[:2]:  # Ensure exactly 2
        choice_text = choice.get("text", "Continue forward")
        next_passage = choice.get("next_passage", "You continue on your journey...")
        is_ending = choice.get("is_ending", False) or is_near_ending
        is_winning = choice.get("is_winning", False)

        similarity_score = 0.0
        if model and target_ending_vec is not None:
            try:
                choice_vec = model.encode(choice_text)
                similarity_score = compute_cosine_similarity(choice_vec, target_ending_vec)
            except Exception as e:
                logger.error(f"Error computing embedding similarity: {e}")

        child_node = StoryNode(
            story_id=story.id,
            content=next_passage,
            is_root=False,
            is_ending=is_ending,
            is_winning=is_winning,
            depth=next_depth,
            options=[]
        )
        db.add(child_node)
        db.commit()
        db.refresh(child_node)

        node_options.append({
            "text": choice_text,
            "node_id": child_node.id,
            "similarity_score": round(similarity_score, 4)
        })

    current_node.options = node_options
    db.commit()
    db.refresh(current_node)

    return current_node


def extract_json_payload(text: str) -> Optional[Dict[str, Any]]:
    if not text:
        return None
    cleaned = text.strip()
    if "```json" in cleaned:
        try:
            block = cleaned.split("```json")[1].split("```")[0].strip()
            return json.loads(block)
        except Exception:
            pass
    if "```" in cleaned:
        try:
            block = cleaned.split("```")[1].split("```")[0].strip()
            return json.loads(block)
        except Exception:
            pass
    try:
        return json.loads(cleaned)
    except Exception:
        pass
    try:
        start_idx = cleaned.find("{")
        end_idx = cleaned.rfind("}")
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            return json.loads(cleaned[start_idx:end_idx + 1])
    except Exception:
        pass
    return None


def translate_story(
    db: Session,
    story: Story,
    ending_node_id: int,
    language: str = "hindi"
) -> Dict[str, Any]:
    """
    Generates/translates only the story summary into Marathi or Hindi using Groq LLM with Devanagari script.
    """
    # 1. Normalize language name
    normalized_lang = language.lower().strip()
    if normalized_lang in ["marathi", "mr"]:
        target_lang_name = "Marathi"
        native_lang_label = "मराठी"
    else:
        target_lang_name = "Hindi"
        native_lang_label = "हिंदी"

    # 2. Reconstruct story path highlights from root to ending_node_id
    all_nodes = db.query(StoryNode).filter(StoryNode.story_id == story.id).all()
    node_map = {n.id: n for n in all_nodes}
    child_to_parent = {}

    for node in all_nodes:
        if node.options:
            for opt in node.options:
                child_id = opt.get("node_id")
                if child_id:
                    child_to_parent[child_id] = {
                        "parent_id": node.id,
                        "choice_text": opt.get("text", "")
                    }

    # Trace backwards
    step_infos = []
    walk_id = ending_node_id
    ending_node = node_map.get(walk_id)
    if ending_node:
        step_infos.append({
            "content": ending_node.content,
            "choice_made": None
        })
    elif all_nodes:
        ending_node = all_nodes[-1]
        step_infos.append({
            "content": ending_node.content,
            "choice_made": None
        })
        walk_id = ending_node.id

    while walk_id in child_to_parent:
        info = child_to_parent[walk_id]
        parent_node = node_map.get(info["parent_id"])
        if parent_node:
            step_infos.append({
                "content": parent_node.content,
                "choice_made": info["choice_text"]
            })
            walk_id = parent_node.id
        else:
            break

    step_infos.reverse()

    # Form an English recap of the path
    journey_recap = ""
    for idx, step in enumerate(step_infos, start=1):
        if step["choice_made"]:
            journey_recap += f"Chapter {idx}: {step['content'][:140]}... (Choice: {step['choice_made']})\n"
        else:
            journey_recap += f"Finale: {step['content']}\n"

    ending_content = ending_node.content if ending_node else (story.description or story.title)
    original_summary = ending_content

    # 3. Call Groq API to translate only the summary
    translated_data = None
    if settings.GROQ_API_KEY:
        try:
            import groq
            client = groq.Groq(api_key=settings.GROQ_API_KEY)

            prompt = f"""You are an expert literary writer and translator fluent in English and {target_lang_name} ({native_lang_label}).
Translate and summarize the following Choose Your Own Adventure story into an engaging, cohesive 1-2 paragraph summary in {target_lang_name} ({native_lang_label}) using Devanagari script.

Story Title: {story.title}
Target Language: {target_lang_name} ({native_lang_label})

Journey Highlights:
{journey_recap}

Ending Resolution:
{ending_content}

Instructions:
1. Translate the story title into {target_lang_name}.
2. Write a captivating, atmospheric 1-2 paragraph narrative SUMMARY of the complete adventure and its ending in {target_lang_name} (Devanagari script).
3. Output STRICTLY a valid JSON object matching this schema:
{{
  "translated_title": "Translated story title in {target_lang_name}",
  "summary": "Captivating 1-2 paragraph summary in {target_lang_name}..."
}}"""

            groq_models = [
                "openai/gpt-oss-120b",
                "openai/gpt-oss-20b",
                "groq/compound-mini",
                "groq/compound"
            ]

            for model_name in groq_models:
                try:
                    logger.info(f"Attempting summary translation to {target_lang_name} with model: {model_name}")
                    completion = client.chat.completions.create(
                        model=model_name,
                        messages=[
                            {
                                "role": "system",
                                "content": f"You are a professional literary translator. Output strictly valid JSON. Provide a rich, cohesive summary in {target_lang_name} in Devanagari script."
                            },
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.3,
                        max_tokens=2048
                    )
                    raw_response = completion.choices[0].message.content
                    parsed = extract_json_payload(raw_response)
                    if parsed and "summary" in parsed:
                        translated_data = parsed
                        logger.info(f"Successfully translated summary to {target_lang_name} using '{model_name}'!")
                        break
                except Exception as model_err:
                    logger.warning(f"Summary translation with Groq model {model_name} failed: {model_err}")
                    continue
        except Exception as e:
            logger.error(f"Groq API error during summary translation: {e}")

    # Build final response
    translated_title = story.title
    translated_summary = original_summary

    if translated_data:
        if translated_data.get("translated_title"):
            translated_title = translated_data["translated_title"]
        if translated_data.get("summary"):
            translated_summary = translated_data["summary"]

    return {
        "title": story.title,
        "translated_title": translated_title,
        "language": normalized_lang,
        "summary": translated_summary,
        "original_summary": original_summary
    }


