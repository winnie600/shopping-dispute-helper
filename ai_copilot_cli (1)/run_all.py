import argparse
from copilot import handle_question

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--cli", action="store_true", help="啟動命令列互動模式")
    args = parser.parse_args()

    if args.cli:
        print("歡迎使用 AI Copilot CLI，輸入 'exit' 離開")
        while True:
            q = input("你：")
            if q.lower() in ("exit", "quit"):
                break
            answer = handle_question(q)
            print("AI：", answer)
    else:
        import uvicorn
        from fastapi import FastAPI
        app = FastAPI()

        @app.get("/ask")
        def ask(question: str):
            return {"answer": handle_question(question)}

        uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)