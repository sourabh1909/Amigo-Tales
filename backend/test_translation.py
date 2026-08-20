import os
import sys

# Reconfigure stdout for UTF-8 in console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure backend root is on Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from db.database import SessionLocal, create_tables
from models.story import Story, StoryNode
from services.story_generator import translate_story

def run_translation_test():
    print("--- Testing Story Summary Translation Feature ---")
    create_tables()
    db = SessionLocal()
    try:
        # Find latest story with an ending node
        story = db.query(Story).order_by(Story.id.desc()).first()
        if not story:
            print("No story found in database. Creating a mock story for test...")
            story = Story(title="The Ancient Temple", session_id="test-session", description="Adventure in the temple")
            db.add(story)
            db.commit()
            db.refresh(story)

            root_node = StoryNode(
                story_id=story.id,
                content="You enter the dark, mossy ruins of an ancient temple hidden deep within the jungle.",
                is_root=True,
                is_ending=False,
                depth=0,
                options=[]
            )
            db.add(root_node)
            db.commit()
            db.refresh(root_node)

            ending_node = StoryNode(
                story_id=story.id,
                content="You discover the glowing relic of the sun god atop the stone altar. Its warmth envelops you, bringing peace to the forgotten lands.",
                is_root=False,
                is_ending=True,
                is_winning=True,
                depth=1,
                options=[]
            )
            db.add(ending_node)
            db.commit()
            db.refresh(ending_node)

            root_node.options = [{"text": "Climb the stone altar steps", "node_id": ending_node.id}]
            db.commit()

        # Find ending node for story
        ending_node = db.query(StoryNode).filter(StoryNode.story_id == story.id, StoryNode.is_ending == True).first()
        if not ending_node:
            ending_node = db.query(StoryNode).filter(StoryNode.story_id == story.id).all()[-1]

        print(f"Testing with Story ID: {story.id}, Title: {story.title}, Ending Node ID: {ending_node.id}")

        print("\n=== 1. Testing Hindi Summary Translation ===")
        hindi_result = translate_story(db=db, story=story, ending_node_id=ending_node.id, language="hindi")
        print(f"Original Title: {hindi_result['title']}")
        print(f"Hindi Title: {hindi_result['translated_title']}")
        print(f"Hindi Summary:\n{hindi_result['summary']}")

        print("\n=== 2. Testing Marathi Summary Translation ===")
        marathi_result = translate_story(db=db, story=story, ending_node_id=ending_node.id, language="marathi")
        print(f"Original Title: {marathi_result['title']}")
        print(f"Marathi Title: {marathi_result['translated_title']}")
        print(f"Marathi Summary:\n{marathi_result['summary']}")

        print("\n Summary Translation test passed successfully!")

    finally:
        db.close()

if __name__ == "__main__":
    run_translation_test()
