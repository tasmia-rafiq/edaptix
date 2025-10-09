# 🎓 Edaptix — AI Wrapper-Powered Learning Ecosystem

> **Empowering Teachers. Guiding Students. Enhancing Learning through Intelligent AI Wrappers.**

---

## 🧩 Overview

**Edaptix** is an AI-powered educational platform built to **bridge the gap between teaching and adaptive learning** in Pakistan’s evolving academic landscape.  
It provides an **AI Wrapper** that orchestrates multiple modalities — **text, voice, and reasoning agents** — to support both **teachers** and **students** through a unified, intelligent interface.

---

## 🚀 Problem Relevance

Pakistan’s education system faces chronic challenges:
- Lack of Teaching Assistants (TA) and resource imbalance between teachers and students  
- Inconsistent feedback and assessment quality  
- Limited access to personalized tutoring and learning analytics  

**Edaptix** addresses these by enabling:
- Teachers to automate test creation, grading, and feedback
- Students to receive personalized AI guidance, adaptive feedback, and multimodal interaction
- Schools to monitor analytics and optimize resource use

> 💡 *Aligned with local educational challenges and teacher-student ratios in Pakistan.*

---

## 🧠 Innovation & Creativity

Unlike generic e-learning tools, **Edaptix** is built around an **AI Wrapper Layer** that:
1. **Integrates multiple AI models and tools** under one standard interface.
2. **Processes multi-modal inputs** — text, voice, and contextual reasoning.
3. **Routes and refines feedback dynamically** between models like **Grok** and **Tavily Search Agents**, enhancing educational responses with factual grounding.

Example flow:
> 🧩 *Student submits a test ➜ AI generates feedback (Grok) ➜ Wrapper agent refines feedback via Tavily Search ➜ Final actionable feedback sent to student.*

This **chained orchestration** demonstrates **AI agent collaboration** — a key element of wrapper design.

---

## ⚙️ Technical Architecture

| Layer | Description |
|-------|--------------|
| **Frontend (Next.js)** | Modern React-based UI with responsive dashboards for teachers and students |
| **Backend (Next.js API Routes)** | Handles test generation, student submissions, AI requests, and feedback pipelines |
| **AI Core (Wrapper Layer)** | GPT-4.1 powered reasoning engine with custom middleware for routing and refinement |
| **Voice Layer** | Integrated speech recognition (input) and text-to-speech synthesis (output) for natural interaction |
| **Database (MongoDB)** | Stores user data, test responses, AI-generated feedback, and analytics |
| **Deployment** | Cloud-native via **Vercel**, scalable and secure |
| **Analytics Dashboard** | Lightweight metric cards display submission rates, feedback completion, and engagement trends |

---

## 🧩 AI Wrapper Capabilities

| Capability | Implementation |
|-------------|----------------|
| **Base Model Integration** | GPT-4.1 (OpenAI API) for reasoning and explanation generation |
| **Abstraction Layer** | Custom Next.js middleware handling prompt formatting and normalization |
| **Multi-Modal Support** | Text, voice input/output |
| **Agent Orchestration** | Grok → Tavily Search flow for fact-grounded feedback refinement |
| **Data Handling** | MongoDB schema for user-specific tests, results, and generated responses |
| **Evaluation & Monitoring** | Dashboard tracking number of students, test completions, and AI feedback quality |
| **Security & Ethics** | Full authentication/authorization; strict teacher–student data segregation |
| **Deployment** | Vercel (Next.js serverless), easily portable to Docker for future scaling |

---

## 🧮 Scalability & Impact

**Edaptix** is designed for:
- 📈 **Scalability:** Cloud deployment with modular Next.js architecture  
- 🌍 **Replicability:** Adaptable to different curricula and local datasets  
- 🎯 **Impact:** Reduces teacher workload, democratizes quality feedback, and enables AI-assisted learning

> *By optimizing how feedback loops are generated and verified, Edaptix empowers teachers to focus on mentorship rather than mechanical grading.*

---

## 🎤 Prototype Functionality

**Working Features:**
- ✅ Teachers can create and check tests  
- ✅ AI-generated and refined feedback for each student  
- ✅ Student dashboard with test submissions and feedback history  
- ✅ Personalized AI tutor for concept explanation (text + voice)  
- ✅ Voice-enabled chat for inclusive accessibility  
- ✅ Real-time analytics on teacher and student activity  

---

## 🧱 Ethical Compliance

- Data separation by role (teacher/student)
- No unauthorized access to educational material
- Responsible AI usage with clear consent-based interactions
- No data sharing with third parties

---

## 🧪 Example Tech Stack

- Frontend: Next.js + TailwindCSS
- Backend: Next.js API Routes (Node.js runtime)
- Database: MongoDB Atlas
- AI Models: GPT-4.1 + Grok Feedback Agent (llama-3.1-8b-instant) + Tavily Search Agent
- Speech: Web Speech API (Recognition + Synthesis)
- Deployment: Vercel (Serverless)