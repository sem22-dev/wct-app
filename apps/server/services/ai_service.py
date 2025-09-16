import logging
import os
from groq import Groq
from core.config import GROQ_API_KEY


logger = logging.getLogger(__name__)


async def generate_call_summary(context: str = ""):
    """Generate AI summary using Groq API"""
    try:
        if not context:
            context = "Customer called about account login issues. Needs password reset assistance."
            
        groq_client = Groq(api_key=GROQ_API_KEY)
        
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that creates concise call summaries for warm transfers. Keep it under 50 words and include key details for the next agent. Be professional and clear."
                },
                {
                    "role": "user", 
                    "content": f"Create a warm transfer summary for this call context: {context}"
                }
            ],
            model="llama-3.1-8b-instant",
            max_tokens=100,
            temperature=0.1
        )
        
        summary = chat_completion.choices[0].message.content
        logger.info("\n" + "="*50 + f"\nGenerated summary:\n{summary}\n" + "="*50)
        return summary
        
    except Exception as e:
        print(f"Groq API Error: {e}")
        return f"Call Summary: {context} - Customer needs assistance and requires transfer to specialist agent."

