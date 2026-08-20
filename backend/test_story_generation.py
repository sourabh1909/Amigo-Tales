import os
import sys

# Ensure backend root is on Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db.database import SessionLocal, create_tables
from services.story_generator import generate_groq_story, get_embedding_model, compute_cosine_similarity

def run_test():
    print("--- 1. Initializing Tables ---")
    create_tables()

    print("--- 2. Testing all-MiniLM-L6-v2 Model Loading ---")
    model = get_embedding_model()
    if model:
        print("all-MiniLM-L6-v2 model loaded successfully!")
        vec1 = model.encode("Hack the central computer core")
        vec2 = model.encode("Defeat the corrupt corporate AI and free humanity")
        sim = compute_cosine_similarity(vec1, vec2)
        print(f"Sample Embedding Cosine Similarity: {sim:.4f}")
    else:
        print("Warning: SentenceTransformer model failed to load.")

    print("--- 3. Testing Groq API & Embedding Guided Story Generation ---")
    db = SessionLocal()
    try:
        story = generate_groq_story(
            db=db,
            theme="Cyberpunk Resistance",
            session_id="test-session-123",
            target_ending="Hack the central computer core and free all citizens"
        )
        print(f"Successfully generated Story ID: {story.id}")
        print(f"Title: {story.title}")
        print(f"Target Ending: {story.target_ending}")
        print(f"Nodes count: {len(story.nodes)}")
        for n in story.nodes:
            print(f"  - Node {n.id} (Root={n.is_root}, Ending={n.is_ending}, Win={n.is_winning})")
            if n.options:
                print(f"    Options: {n.options}")
    finally:
        db.close()

if __name__ == "__main__":
    run_test()
