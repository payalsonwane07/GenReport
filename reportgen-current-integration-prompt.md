# ReportGen — Current Prompt (Integration Only)

Ye ab wala prompt hai — chunki starter scaffold already bana hua hai (backend routes, 
schema, frontend component sab ready), Cursor ko sirf INTEGRATE karna hai, naya code 
likhne ki zaroorat nahi. Isse tier bahut kam use hogi.

---

## CURRENT PROMPT (copy everything below)

```
I have an existing MERN stack project called "ReportGen" (file upload + report 
generation). I've also prepared a ready-made scaffold folder for an AI chatbot 
feature, which includes:

- backend/config/db.js — MongoDB connection
- backend/models/ChatMessage.js — chat history schema
- backend/routes/chat.js — POST /api/chat (Groq API call) + GET /api/chat/:reportId 
  (chat history), already has rate limiting and error handling
- backend/server.js — base Express server setup
- frontend/src/components/ReportChatbot.jsx — complete chatbot UI component 
  (chat bubbles, typing indicator, auto-scroll)
- .env.example and .gitignore — already configured for security

I do NOT want you to rewrite this code from scratch. Your job is ONLY to 
INTEGRATE it into my existing project. Specifically:

1. Look at my existing backend folder structure and my existing Report model 
   (Mongoose schema). Tell me its exact field names for the report data.

2. In backend/routes/chat.js, there are two TODO comments — replace the 
   placeholder Report fetch logic with a real call to my actual Report model, 
   using the correct field names you find in step 1. Make sure reportContext 
   sent to Groq is built from my real report data.

3. Look at my existing server.js / app entry file. Merge in the chat routes 
   (app.use('/api/chat', chatRoutes)) and the MongoDB connection without 
   duplicating anything I already have working (upload routes, existing 
   DB connection, existing middleware).

4. Look at my existing report/dashboard page (React). Import and place 
   <ReportChatbot reportId={...} apiBaseUrl={...} /> right after the report 
   is displayed, passing in the correct reportId from my existing state/props.

5. Confirm my existing .env already has MONGO_URI, and add GROQ_API_KEY to it 
   if missing (just tell me to add it — don't touch the file for secrets).

6. After integration, give me a short test checklist to confirm: upload still 
   works, report generation still works, chatbot returns answers based on 
   real report data, and chat history persists on refresh.

Do this in the smallest number of edits possible — reuse the scaffold code 
as-is wherever it already fits, only touch what's necessary to wire it into 
my existing project. Ask to see my existing Report model and server entry 
file first before changing anything.
```

---

## Isko use karne se pehle
- [ ] Scaffold zip already unzip karke apne project ke andar (ya paas mein) rakh li hai
- [ ] `.env` mein `MONGO_URI` already hai, `GROQ_API_KEY` add karna baki hai
- [ ] Apna existing Report model ka path pata hai (Cursor maangega)

Cursor kam se kam edits karega kyunki usko "naya likho" nahi, "existing scaffold ko integrate karo" bola gaya hai — isse requests kaafi bachengi.
