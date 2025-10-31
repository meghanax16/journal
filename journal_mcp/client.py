import asyncio
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

async def main():
    client = MultiServerMCPClient(
        {
            "journal-mcp": {
                "transport": "streamable_http",  # HTTP-based remote server
                "url": "http://localhost:8000/mcp",
            }
        }
    )

    load_dotenv()
    model = ChatOpenAI(model="gpt-4o")
    tools = await client.get_tools()

    # print(tool.name for tool in tools)
    
    agent = create_agent(
        model,
        tools
    )
    
    math_response = await agent.ainvoke(
        {"messages": [{"role": "user", "content": "Mark reading as completed for yesterday"}]}
    )

    print(math_response["messages"][-1].content)

if __name__ == "__main__":
    asyncio.run(main())
