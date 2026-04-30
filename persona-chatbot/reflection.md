# Reflection — Persona-Based AI Chatbot

## What Worked

The most effective decision I made was treating research as the actual work, not a preamble to it. Before writing a single line of any system prompt, I spent time understanding each person — how Anshuman explains DSA concepts in Scaler videos, the specific language and tone Abhimanyu uses when talking about career trajectory, the kind of analogies Kshitij reaches for when making a technical concept click. This grounding made the prompts specific rather than generic, and specificity is what separates a persona that genuinely sounds like someone from one that merely claims to be them.

The most powerful prompt engineering technique turned out to be the few-shot examples. Writing out full model exchanges — a realistic student question followed by an authentic persona-style response — forced me to operationalise every abstract descriptor I had written. It is easy to write "Anshuman is direct and technical." Writing an actual response *as* Anshuman makes you realise that "direct and technical" still leaves enormous latitude, and you have to narrow it down. After I wrote the first few-shot example, I had a much clearer picture of who the persona actually was than I did after writing the persona description.

The Chain-of-Thought instruction also meaningfully improved response quality. Telling the model to reason internally about "what is the person's actual underlying challenge?" before responding shifted outputs from surface-level answers to more empathetic, targeted ones. The model's internal reasoning step acts as a buffer between the raw question and the response — it produces answers that address what the student *actually* needs rather than just what they literally asked.

## What the GIGO Principle Taught Me

The Garbage In, Garbage Out principle hit hardest during the first round of testing. My initial Kshitij prompt said something like "you are an energetic instructor who uses analogies and casual language." The outputs were flat — generic enthusiasm with no real personality. The problem was not the model; it was my input. I was describing a caricature, not a person.

When I rewrote the prompt with *specific* examples of the kinds of analogies Kshitij uses — a library card catalog for database indexing, pizza delivery for REST APIs — the outputs transformed immediately. The model did not need to be *told* to be "funny" or "engaging"; it needed to be *shown* what that actually looked like in practice.

This taught me a precise lesson about system prompts: adjectives describe; examples demonstrate. "Be direct" is a weak instruction. A few-shot example that shows directness in action is a strong instruction. Every hour I spent trying to find the right adjective to describe a persona would have been better spent writing one more example exchange. The quality of your prompt is bounded by the specificity of your inputs — there is no way to extract a compelling persona from a vague description, regardless of how capable the model is.

## What I Would Improve

Three things stand out. First, I would add conversation memory that persists the persona's own statements across sessions — allowing each persona to reference things they said earlier in the conversation, making it feel less like a stateless API call and more like a real ongoing dialogue.

Second, I would invest time in adversarial testing: deliberately trying to get each persona to break character, give inconsistent answers, or make claims that contradict public facts about the real person. The constraints section of each prompt was written mostly from first principles; red-teaming would reveal the specific failure modes I actually need to guard against.

Third, I would explore streaming responses. The current implementation waits for the full response before displaying anything, which creates an awkward pause. Streaming — where tokens appear progressively — makes the interaction feel significantly more natural, especially for longer, more detailed answers that the Kshitij or Anshuman personas tend to produce.
