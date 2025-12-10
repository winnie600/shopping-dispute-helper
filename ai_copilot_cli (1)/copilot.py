from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

tokenizer = AutoTokenizer.from_pretrained("models/meta-llama-3.1-8b-instruct")
model = AutoModelForCausalLM.from_pretrained(
    "models/meta-llama-3.1-8b-instruct",
    device_map="auto",
    torch_dtype=torch.float16
)

def handle_question(question: str) -> str:
    inputs = tokenizer(question, return_tensors="pt").to(model.device)
    outputs = model.generate(**inputs, max_new_tokens=256)
    answer = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return answer