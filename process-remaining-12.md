# Process Remaining 12 Videos via Gemini Personal Intelligence

## Status
These 12 videos don't have auto-generated transcripts, so they need to be processed using Gemini's Personal Intelligence feature.

---

## Videos to Process

### AI-Related Videos (10)

1. **#575: Build Blazing-Fast LLM Apps with Groq, Langflow, & Langchain**
   - URL: https://www.youtube.com/watch?v=4ukqsKajWnk

2. **#576: Building a Generative UI App With LangChain Python**
   - URL: https://www.youtube.com/watch?v=d3uoLbfBPkw

3. **#577: New Discovery: LLMs have a Performance Phase**
   - URL: https://www.youtube.com/watch?v=QgOeWbW0jeA

4. **#578: How to Make AI Influencers For FREE (full-process)**
   - URL: https://www.youtube.com/watch?v=oELYollTFeQ

5. **#579: How to use Llama 3 API for FREE**
   - URL: https://www.youtube.com/watch?v=VmNhDUKMHd4

6. **#580: Gold Gang (100% AI) | INSANE AI Music Video**
   - URL: https://www.youtube.com/watch?v=TqSDSzd_QRY

7. **#582: The Manipulation Expert (Robert Greene)**
   - URL: https://www.youtube.com/watch?v=yrwSOMFZvHY

8. **#583: LCM for Krita - OVERPOWERED!!!!**
   - URL: https://www.youtube.com/watch?v=XGFWIwUrzYM

9. **#584: World's First AGI Agent (Devin)**
   - URL: https://www.youtube.com/watch?v=1RxbHg0Nsw0

10. **#585: INSANELY Fast AI Cold Call Agent- built w/ Groq**
    - URL: https://www.youtube.com/watch?v=WCYf2Agml-s

### Non-AI Videos (2) - Optional

11. **#635: Mushroom Cultivation** (members-only)
    - URL: https://www.youtube.com/watch?v=Ng_Wq9PnEVI

12. **#643: Krusty Krab vocoded meme**
    - URL: https://www.youtube.com/watch?v=fMKziH-oDkM

---

## Processing Instructions

### Step 1: Go to Gemini

Visit: https://gemini.google.com

### Step 2: Copy and Paste This Prompt

```
Using your Personal Intelligence access to my YouTube watch history, please analyze these 10 AI-related videos and provide structured analysis for each.

For each video, provide:
- Key points (3-5 main takeaways)
- AI concepts mentioned
- Technical details (tools, frameworks, implementation)
- Visual elements shown
- Summary (2-3 sentences)

Format each as JSON matching this schema:
{
  "keyPoints": ["point1", "point2", ...],
  "aiConcepts": ["concept1", "concept2", ...],
  "technicalDetails": ["detail1", "detail2", ...],
  "visualElements": ["element1", "element2", ...],
  "summary": "Brief overview"
}

Videos:

1. Video #575: Build Blazing-Fast LLM Apps with Groq, Langflow, & Langchain
   https://www.youtube.com/watch?v=4ukqsKajWnk

2. Video #576: Building a Generative UI App With LangChain Python
   https://www.youtube.com/watch?v=d3uoLbfBPkw

3. Video #577: New Discovery: LLMs have a Performance Phase
   https://www.youtube.com/watch?v=QgOeWbW0jeA

4. Video #578: How to Make AI Influencers For FREE (full-process)
   https://www.youtube.com/watch?v=oELYollTFeQ

5. Video #579: How to use Llama 3 API for FREE
   https://www.youtube.com/watch?v=VmNhDUKMHd4

6. Video #580: Gold Gang (100% AI) | INSANE AI Music Video
   https://www.youtube.com/watch?v=TqSDSzd_QRY

7. Video #582: The Manipulation Expert (Robert Greene)
   https://www.youtube.com/watch?v=yrwSOMFZvHY

8. Video #583: LCM for Krita - OVERPOWERED!!!!
   https://www.youtube.com/watch?v=XGFWIwUrzYM

9. Video #584: World's First AGI Agent (Devin)
   https://www.youtube.com/watch?v=1RxbHg0Nsw0

10. Video #585: INSANELY Fast AI Cold Call Agent- built w/ Groq
    https://www.youtube.com/watch?v=WCYf2Agml-s
```

### Step 3: Save Responses

Copy each JSON response and save to individual files, or save all as one JSON array.

### Step 4: Convert to Reports

Once you have the JSON responses, we'll convert them using the convert-gemini-responses.js script (similar to how we processed the previous 8 videos).

---

## Alternative: Process One-by-One

If batch processing doesn't work, process each video individually:

```
Please analyze this YouTube video using your Personal Intelligence access.

Provide:
- Key points
- AI concepts
- Technical details
- Visual elements
- Summary

Format as JSON.

Video #575: https://www.youtube.com/watch?v=4ukqsKajWnk
```

Repeat for each video.

---

## After Getting Responses

1. Save all JSON responses
2. Create a new conversion script or update convert-gemini-responses.js
3. Run the converter to generate report files
4. Verify reports are created in data/video-reports/

---

## Final Status

After processing these 10 AI videos:
- **Total:** 647 videos
- **Processed:** 645 videos (99.7%)
- **Skipped:** 2 non-AI videos

**Nearly complete! 🎉**
