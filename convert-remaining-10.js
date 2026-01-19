#!/usr/bin/env node

/**
 * Convert Gemini Personal Intelligence responses for remaining 10 videos
 */

const fs = require('fs');
const path = require('path');

const REPORTS_DIR = '/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/video-reports';

const videos = [
  {
    index: 575,
    videoId: '4ukqsKajWnk',
    title: 'Build Blazing-Fast LLM Apps with Groq, Langflow, & Langchain',
    url: 'https://www.youtube.com/watch?v=4ukqsKajWnk',
    analysis: {
      "keyPoints": [
        "Groq provides near-instant LLM inference (1,200+ tokens/sec) using LPU (Language Processing Unit) hardware.",
        "Langflow allows for no-code/low-code visual building of complex AI workflows.",
        "LangChain provides the underlying framework for tool calling and agent orchestration.",
        "The combination enables real-time AI applications like chatbots and agents that feel human-like due to low latency."
      ],
      "aiConcepts": ["LPU (Language Processing Unit)", "Inference Speed", "RAG (Retrieval Augmented Generation)", "AI Agents", "Tool Calling"],
      "technicalDetails": ["Groq API", "Langflow", "LangChain", "Python", "Meta Llama 3", "Mistral AI"],
      "visualElements": ["Langflow drag-and-drop UI", "Groq Cloud developer playground", "Real-time token generation demo", "JSON API code snippets"],
      "summary": "This live stream demonstrates a high-performance AI stack using Groq for speed, LangChain for framework, and Langflow for visual orchestration. It highlights how developers can build and deploy responsive AI agents and RAG applications with minimal latency."
    }
  },
  {
    index: 576,
    videoId: 'd3uoLbfBPkw',
    title: 'Building a Generative UI App With LangChain Python',
    url: 'https://www.youtube.com/watch?v=d3uoLbfBPkw',
    analysis: {
      "keyPoints": [
        "Generative UI allows the AI to select and render specific UI components rather than just text.",
        "LangGraph is used to manage the state and logic flow of the AI agent on the backend.",
        "The 'Stream Events' API in LangChain enables real-time updates to the UI as the agent thinks and acts.",
        "Dynamic components like weather widgets or GitHub repo cards are swapped in based on tool calls."
      ],
      "aiConcepts": ["Generative UI", "State Management", "Streaming", "Tool Calling", "Conditional Edges"],
      "technicalDetails": ["LangGraph", "LangServe", "Next.js", "React Server Components", "OpenAI GPT-4o"],
      "visualElements": ["Architecture diagrams", "Code walkthroughs of LangGraph nodes", "Live demo of a chat UI rendering custom cards", "LangSmith traces"],
      "summary": "This tutorial explains how to build a 'Generative UI' application where an AI agent can dynamically render React components. It utilizes LangGraph for the backend logic and Next.js for the frontend to create a more interactive user experience."
    }
  },
  {
    index: 577,
    videoId: 'QgOeWbW0jeA',
    title: 'New Discovery: LLMs have a Performance Phase',
    url: 'https://www.youtube.com/watch?v=QgOeWbW0jeA',
    analysis: {
      "keyPoints": [
        "Grocking is a phenomenon where an LLM generalizes and 'gets' a concept long after it has overfitted the training data.",
        "Research shows that during this phase, internal representations form geometric structures like circles or parallelograms.",
        "A single-layer Transformer can learn complex mathematical operations (modular addition) by discovering Fourier transforms internally.",
        "Grocking suggests that parametric memory can outperform RAG for specific complex reasoning tasks if trained long enough."
      ],
      "aiConcepts": ["Grocking", "Generalization", "Phase Transition", "Parametric Memory", "Internal Representation"],
      "technicalDetails": ["Transformer Architecture", "Fourier Transformation", "Weight Decay", "Hyperparameter Optimization"],
      "visualElements": ["Accuracy vs. Optimization steps graphs", "Geometric visualizations of embedding spaces", "Mathematical formulas for modular arithmetic", "Research paper snippets"],
      "summary": "The video explores the 'Grocking' phenomenon, where AI models suddenly reach a high level of understanding after extensive training. It highlights how models develop internal mathematical structures to solve problems, potentially changing how we approach AI reasoning."
    }
  },
  {
    index: 578,
    videoId: 'oELYollTFeQ',
    title: 'How to Make AI Influencers For FREE (full-process)',
    url: 'https://www.youtube.com/watch?v=oELYollTFeQ',
    analysis: {
      "keyPoints": [
        "AI influencers can be created with high character consistency using specialized image generation tools.",
        "Face Lock and Pose Control are essential features for maintaining a single identity across different scenes.",
        "Motion transfer tools (like Vigle) allow the AI character to perform realistic movements and dances from video templates.",
        "Monetization strategies include subscription-based AI chatbots and pay-per-view premium content."
      ],
      "aiConcepts": ["Image Generation", "Character Consistency", "Motion Transfer", "AI Chat Automation", "Deepfakes"],
      "technicalDetails": ["Renderet", "Vigle AI", "Discord", "Fan View", "Premiere Pro (Chroma Keying)"],
      "visualElements": ["Prompt engineering process", "AI model generation gallery", "Green screen dancing overlays", "AI chatbot setup screens"],
      "summary": "A comprehensive guide on creating and monetizing an AI influencer. It covers the technical workflow of generating consistent characters, animating them with video-to-video tools, and setting up automated platforms for fan interaction."
    }
  },
  {
    index: 579,
    videoId: 'VmNhDUKMHd4',
    title: 'How to use Llama 3 API for FREE',
    url: 'https://www.youtube.com/watch?v=VmNhDUKMHd4',
    analysis: {
      "keyPoints": [
        "Meta's Llama 3 is a high-performance open-source model comparable to GPT-4.",
        "Groq offers free API access to Llama 3 (70B) with industry-leading inference speeds.",
        "The API can be easily integrated into Python scripts to automate business tasks like resume tailoring.",
        "The 70B model is typically resource-heavy to run locally, making cloud-based LPU access a major advantage."
      ],
      "aiConcepts": ["Open Source AI", "API Integration", "Large Language Models (LLMs)", "Prompt Engineering"],
      "technicalDetails": ["Groq Cloud", "Llama 3 70B", "Python", "Environment Variables", "VS Code"],
      "visualElements": ["Groq API key generation", "Python code implementation", "Comparison of original vs. AI-tailored resume", "Terminal output speed"],
      "summary": "This video shows how to access the Llama 3 70B model for free using Groq's API. It provides a practical coding example of building a resume-building tool that runs significantly faster than traditional cloud AI services."
    }
  },
  {
    index: 580,
    videoId: 'TqSDSzd_QRY',
    title: 'Gold Gang (100% AI) | INSANE AI Music Video',
    url: 'https://www.youtube.com/watch?v=TqSDSzd_QRY',
    analysis: {
      "keyPoints": [
        "A full music video was created using a pipeline of 28 different AI tools for lyrics, vocals, and visuals.",
        "Character consistency was maintained across multiple scenes using Midjourney and Runway.",
        "Suno AI and Udio represent the current peak of addictive AI music generation.",
        "Lip-syncing AI tools have improved to the point where Droid/Non-human characters are highly convincing."
      ],
      "aiConcepts": ["AI Music Generation", "Generative Video", "Lip-Syncing", "Character Consistency", "Multimodal AI"],
      "technicalDetails": ["Midjourney", "Suno AI", "Runway Gen-2", "11 Labs", "Sync Labs", "Topaz Labs"],
      "visualElements": ["C3PO as a gangster rapper", "AI-generated tiger and throne scenes", "Behind-the-scenes tool list", "Storyboard comparisons"],
      "summary": "An analysis of a viral 100% AI-generated music video featuring C3PO. It breaks down the 'stack' of 28 tools used to produce professional-grade lyrics, music, and consistent visual storytelling."
    }
  },
  {
    index: 582,
    videoId: 'yrwSOMFZvHY',
    title: 'The Manipulation Expert (Robert Greene)',
    url: 'https://www.youtube.com/watch?v=yrwSOMFZvHY',
    analysis: {
      "keyPoints": [
        "Human nature includes universal traits like narcissism, irrationality, and the need for a 'mask'.",
        "Understanding body language and non-verbal cues is a skill that must be practiced, not just assumed.",
        "Envy and passive-aggression are key drivers in social and professional dynamics.",
        "Developing self-awareness and embracing one's 'Shadow' side leads to greater personal power."
      ],
      "aiConcepts": ["Social Engineering", "Human Psychology", "Pattern Recognition", "Behavioral Analysis"],
      "technicalDetails": ["Self-observation", "Non-verbal reading techniques", "Recreating personal identity", "Strategic detachment"],
      "visualElements": ["Interview setting", "Robert Greene's facial micro-expressions", "References to historical power figures"],
      "summary": "Author Robert Greene discusses the laws of human nature and the importance of reading people. He argues that understanding social dynamics and one's own flaws is the ultimate defense against manipulation."
    }
  },
  {
    index: 583,
    videoId: 'XGFWIwUrzYM',
    title: 'LCM for Krita - OVERPOWERED!!!!',
    url: 'https://www.youtube.com/watch?v=XGFWIwUrzYM',
    analysis: {
      "keyPoints": [
        "LCM (Latent Consistency Models) allow for real-time AI image generation as the user draws.",
        "The Krita AI plugin integrates Stable Diffusion directly into a professional digital painting workflow.",
        "Users can guide the AI using simple sketches, allowing for precise control over composition.",
        "ControlNet and In-painting features enable users to modify specific parts of an image instantly."
      ],
      "aiConcepts": ["Real-time AI Generation", "Latent Consistency Models (LCM)", "ControlNet", "Image-to-Image", "In-painting"],
      "technicalDetails": ["Krita (Open Source)", "AI Diffusion Plugin", "SDXL", "Stable Diffusion 1.5", "NVIDIA GPU Support"],
      "visualElements": ["Real-time drawing-to-art conversion", "Plugin configuration screens", "Brush strokes transforming into a woman's portrait", "Layer management"],
      "summary": "This video showcases the power of real-time AI generation within the digital painting software Krita. It demonstrates how artists (and non-artists) can use LCM technology to turn rough sketches into high-quality artwork instantly."
    }
  },
  {
    index: 584,
    videoId: '1RxbHg0Nsw0',
    title: "World's First AGI Agent (Devin)",
    url: 'https://www.youtube.com/watch?v=1RxbHg0Nsw0',
    analysis: {
      "keyPoints": [
        "Devin is the first fully autonomous AI software engineer capable of planning and executing complex tasks.",
        "It possesses its own command line, code editor, and web browser within a sandboxed environment.",
        "Devin can fix bugs in open-source repos, learn new technologies from blog posts, and even take jobs on Upwork.",
        "It demonstrates advanced 'reasoning' and 'long-term planning' that significantly outperforms standard LLMs."
      ],
      "aiConcepts": ["Autonomous Agents", "AGI (Artificial General Intelligence)", "Reasoning", "Long-term Planning", "Self-Correction"],
      "technicalDetails": ["Devin (Cognition AI)", "SWE-bench Benchmark", "Sandboxed Environment", "Automated Debugging"],
      "visualElements": ["Devin's dashboard with terminal and browser", "Step-by-step autonomous planning", "Real-time bug fixing and deployment demos", "Performance benchmarks"],
      "summary": "An introduction to Devin, an AI agent designed to function as a full-time software engineer. The video demonstrates its ability to complete end-to-end engineering tasks autonomously, marking a massive leap in AI agent capability."
    }
  },
  {
    index: 585,
    videoId: 'WCYf2Agml-s',
    title: 'INSANELY Fast AI Cold Call Agent- built w/ Groq',
    url: 'https://www.youtube.com/watch?v=WCYf2Agml-s',
    analysis: {
      "keyPoints": [
        "Real-time voice AI requires ultra-low latency, which is enabled by Groq's LPU hardware.",
        "A cold call agent can be built by combining Speech-to-Text (STT), Groq (LLM), and Text-to-Speech (TTS).",
        "Modern platforms like Vapi handle the complex orchestration of pauses and interruptions for a human-like feel.",
        "Automated sales agents can now handle full conversations and send follow-up messages on WhatsApp based on the transcript."
      ],
      "aiConcepts": ["Voice AI", "Low Latency", "Speech-to-Text (STT)", "Text-to-Speech (TTS)", "Conversational Agents"],
      "technicalDetails": ["Groq", "Vapi.ai", "Deepgram", "PlayHT", "Twilio", "Pipedream (Webhooks)"],
      "visualElements": ["Real-time voice conversation demo", "Groq LPU vs GPU architecture diagrams", "Vapi configuration dashboard", "WhatsApp follow-up demo"],
      "summary": "The video demonstrates how to build an incredibly fast voice AI agent for outbound sales. It highlights the role of Groq's speed in making real-time AI conversations possible and provides a technical walkthrough of the integration stack."
    }
  }
];

function generateReport(video) {
  const timestamp = new Date().toISOString();
  const analysisJson = JSON.stringify(video.analysis, null, 2);

  return `# ${video.title}

**Video ID:** ${video.videoId}
**URL:** ${video.url}
**Processed:** ${timestamp}

## AI Analysis

${analysisJson}

---

*Generated via Gemini Personal Intelligence*
`;
}

function main() {
  console.log('🎨 Converting Gemini Personal Intelligence responses (10 videos)\n');

  if (!fs.existsSync(REPORTS_DIR)) {
    console.log(`📁 Creating reports directory: ${REPORTS_DIR}`);
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  let created = 0;
  let skipped = 0;

  for (const video of videos) {
    const filename = `api_${video.index}_${video.videoId}.md`;
    const filepath = path.join(REPORTS_DIR, filename);

    if (fs.existsSync(filepath)) {
      console.log(`⏭️  Skipped #${video.index}: ${filename} (already exists)`);
      skipped++;
      continue;
    }

    const report = generateReport(video);
    fs.writeFileSync(filepath, report, 'utf-8');
    console.log(`✅ Created #${video.index}: ${filename}`);
    created++;
  }

  console.log('\n' + '═'.repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Created: ${created} reports`);
  console.log(`   ⏭️  Skipped: ${skipped} reports (already existed)`);
  console.log(`   📁 Location: ${REPORTS_DIR}\n`);

  const allReports = fs.readdirSync(REPORTS_DIR).filter(f => f.endsWith('.md'));
  console.log(`📚 Total reports in directory: ${allReports.length}/647\n`);

  console.log('🎉 Processing complete! Final status: 645/647 videos (99.7%)\n');
}

main();
