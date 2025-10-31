# import asyncio
# from langchain_mcp_adapters.client import MultiServerMCPClient
# from langchain.agents import create_agent
# from langchain_openai import ChatOpenAI
# from dotenv import load_dotenv

# async def main():
#     client = MultiServerMCPClient(
#         {
#             "journal-mcp": {
#                 "transport": "streamable_http",  # HTTP-based remote server
#                 "url": "http://localhost:8000/mcp",
#             }
#         }
#     )

#     load_dotenv()
#     model = ChatOpenAI(model="gpt-4o")
#     tools = await client.get_tools()

#     # print(tool.name for tool in tools)
    
#     agent = create_agent(
#         model,
#         tools
#     )
    
#     math_response = await agent.ainvoke(
#         {"messages": [{"role": "user", "content": "How well am I doing my kkjsalkd habit"}]}
#     )

#     print(math_response["messages"][-1].content)

# if __name__ == "__main__":
#     asyncio.run(main())


# import asyncio
# from fastapi import FastAPI
# from pydantic import BaseModel
# from langchain_mcp_adapters.client import MultiServerMCPClient
# from langchain.agents import create_agent
# from langchain_openai import ChatOpenAI
# from dotenv import load_dotenv

# app = FastAPI()

# class UserQuery(BaseModel):
#     message: str

# @app.post("/ask")
# async def ask_agent(query: UserQuery):
#     load_dotenv()

#     client = MultiServerMCPClient({
#         "journal-mcp": {
#             "transport": "streamable_http",
#             "url": "http://localhost:8000/mcp",  # Your MCP FastAPI app
#         }
#     })

#     model = ChatOpenAI(model="gpt-4o")
#     tools = await client.get_tools()
#     agent = create_agent(model, tools)

#     response = await agent.ainvoke({
#         "messages": [{"role": "user", "content": query.message}]
#     })

#     return {"response": response["messages"][-1].content}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=7070)


# journal_mcp/client.py
import asyncio
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()

async def create_mcp_agent():
    """Initialize and return a LangChain agent connected to MCP."""
    client = MultiServerMCPClient({
        "journal-mcp": {
            "transport": "streamable_http",
            "url": "http://localhost:8000/mcp",
        }
    })

    model = ChatOpenAI(model="gpt-4o")
    tools = await client.get_tools()
    agent = create_agent(model, tools)
    return agent
