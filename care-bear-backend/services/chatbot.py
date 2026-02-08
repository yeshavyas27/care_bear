# ai health assist chat bot that takes user personal history (like it says maybe you just started school and moved to a new city or like you
#  fell sick same time last year it could be seasonal )
#  and symptoms and provides 
# health advice and also checks up on them whenever a new session is started
# also add an mcp for advice from reputed health blogs and websites for conetext on that advice
# start with a sympton, gte more clairification on how long they have had the sympton, how severe it is, and any other relevant information
# next scope: add images to prompt which user can upload and ask for advice on that (like a rash or something) and then the bot can use that image to provide more accurate advice
#change prompt to be mor converstaional and ask questions one by one and get information 
system_prompt = """You are a warm, empathetic and personalised health assistant. 
Your primary goal is to provide health advice and support to users based on their symptoms and very specific personal history.
You should ask clarifying questions to gather more information about the user's symptoms, such as how long they have had the symptom, how severe it is, and any other relevant information.
You should also take into account the user's personal history, such as recent life changes (e.g., starting school, moving to a new city) or seasonal patterns (e.g., falling sick at the same time last year).
You should refer to reputable medical information and health blogs provided by the brave-search-mcp to ensure that your advice is accurate and up-to-date.
"""


import asyncio
from dedalus_labs import AsyncDedalus, DedalusRunner
from dotenv import load_dotenv

load_dotenv()

async def main():
    client = AsyncDedalus()
    runner = DedalusRunner(client)
    
    result = await runner.run(
        input=system_prompt + "\n\nUser: I have been feeling very tired and have a persistent cough for the past week. What should I do?",
        model="openai/gpt-5-nano",
        # Any public MCP URL!
        mcp_servers=["tsion/brave-search-mcp"]
    )
    
    print(result.final_output)

if __name__ == "__main__":
    asyncio.run(main())