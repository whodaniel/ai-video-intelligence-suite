#!/usr/bin/env node

/**
 * Convert Gemini Personal Intelligence responses to standard report format
 *
 * Usage: node convert-gemini-responses.js
 */

const fs = require('fs');
const path = require('path');

const config = require('./lib/config');

const REPORTS_DIR = config.reportsDir;

// Video data with analysis from Gemini Personal Intelligence
const videos = [
  {
    index: 127,
    videoId: 'mRkJTXDromw',
    title: 'Building Decision Agents with LLMs & Machine Learning Models',
    url: 'https://www.youtube.com/watch?v=mRkJTXDromw',
    analysis: {
      "keyPoints": [
        "LLMs are often poor fits for autonomous decision agents due to inconsistency, 'black box' nature, and poor handling of structured data.",
        "Decision agents require 'ruthless consistency' and transparency to meet regulatory and business requirements.",
        "The architecture should use a Decision Platform or Business Rules Management System (BRMS) for logic and Machine Learning for probabilistic predictions.",
        "Effective decision agents should be stateless and side-effect free to ensure reusability across different workflows."
      ],
      "aiConcepts": [
        "Agentic AI",
        "Decision Agents",
        "Probabilistic vs. Prescriptive Logic",
        "Feature Engineering",
        "Supervised vs. Unsupervised Learning",
        "Model Context Protocol (MCP)"
      ],
      "technicalDetails": [
        "Business Rules Management Systems (BRMS)",
        "Decision Platforms",
        "JSON Objects for transaction testing",
        "Model Context Protocol (MCP) servers for tool exposure",
        "Neural Networks and Regression Models for predictive scoring"
      ],
      "visualElements": [
        "Diagram showing the separation of Workflow Agents and Decision Agents.",
        "UI demonstration of Low-code editors and Technical IDEs for rule management.",
        "Workflow diagrams showing data ingestion via LLMs and output explanation via LLMs."
      ],
      "summary": "This video explains why traditional LLMs are insufficient for high-stakes business decisions and advocates for a hybrid approach. It details how to combine prescriptive business rules with probabilistic machine learning models within an agentic framework to achieve consistent, transparent, and scalable results."
    }
  },
  {
    index: 311,
    videoId: 'FLpS7OfD5-s',
    title: 'Why MCP really is a big deal | Model Context Protocol with Tim Berglund',
    url: 'https://www.youtube.com/watch?v=FLpS7OfD5-s',
    analysis: {
      "keyPoints": [
        "MCP (Model Context Protocol) is a standard to connect AI models to data sources and tools without custom 'boilerplate' code for every integration.",
        "It shifts AI from just 'generating words' to 'taking actions' in a professional, enterprise-grade architecture.",
        "The protocol is built on a client-server architecture where host applications interrogate servers for their capabilities.",
        "MCP supports pluggability, discoverability, and composability, allowing servers to act as clients to other servers."
      ],
      "aiConcepts": [
        "Model Context Protocol (MCP)",
        "Agentic AI",
        "Tool Invocation",
        "Retrieval Augmented Generation (RAG)",
        "Host Applications vs. MCP Servers"
      ],
      "technicalDetails": [
        "JSON-RPC for messaging",
        "Standard I/O (stdio) pipes for local process communication",
        "HTTP and Server-Sent Events (SSE) for remote communication",
        "Capability discovery via well-known restful endpoints"
      ],
      "visualElements": [
        "Architectural diagrams showing the Client/Host and Server relationship.",
        "Flowcharts demonstrating how a prompt triggers resource discovery and tool execution.",
        "Visualizations of data sources like Kafka topics and binary files being bridged to an LLM."
      ],
      "summary": "Tim Berglund explains that MCP is the 'USB-C for AI,' providing a standardized way for agents to access enterprise data and tools. The video highlights how this protocol enables professional, scalable agentic applications by making integrations pluggable and discoverable."
    }
  },
  {
    index: 320,
    videoId: 'CKAs9bRMDcQ',
    title: 'The Agent Awakens: Collaborative Development with GitHub Copilot',
    url: 'https://www.youtube.com/watch?v=CKAs9bRMDcQ',
    analysis: {
      "keyPoints": [
        "Evolution of GitHub Copilot from simple autocomplete to an agentic collaborator.",
        "The role of 'GitHub Copilot Extensions' in bringing third-party data into the developer's chat context.",
        "Collaborative development where the AI can plan, write, and debug complex multi-file changes.",
        "Best practices for prompting the agent to maintain architectural integrity in large codebases."
      ],
      "aiConcepts": [
        "AI Pair Programming",
        "Agentic Development",
        "Context Window Management",
        "Collaborative AI Agents"
      ],
      "technicalDetails": [
        "GitHub Copilot Chat",
        "Visual Studio Code Integration",
        "GitHub Copilot Extensions API",
        "Integration with tools like Docker, Azure, and Sentry"
      ],
      "visualElements": [
        "Demonstration of Copilot Chat solving multi-step coding problems.",
        "UI showing the 'Copilot' icon and workspace indexing features.",
        "Comparison of 'legacy' autocomplete vs. 'modern' agent-led planning."
      ],
      "summary": "This video explores the transition of GitHub Copilot into a full AI agent capable of collaborative development. It demonstrates how developers can now use Copilot to plan and execute complex tasks across an entire project rather than just single lines of code."
    }
  },
  {
    index: 477,
    videoId: 'FJdV-iE_Tps',
    title: 'AI Audiobook Generator with Claude, Cline, and ElevenLabs MCP Server',
    url: 'https://www.youtube.com/watch?v=FJdV-iE_Tps',
    analysis: {
      "keyPoints": [
        "Demonstrates using an MCP server to wrap the ElevenLabs API, removing the need for custom integration code in every app.",
        "Shows 'multi-client' flexibility: the same MCP server provides audio services to Claude Desktop, Cline, and a custom web app.",
        "Claude acts as a 'director,' choosing voices based on character descriptions retrieved from the MCP resource.",
        "The workflow includes story generation, voice assignment, audio synthesis, and playback through a separate 'Audio Player' MCP server."
      ],
      "aiConcepts": [
        "Model Context Protocol (MCP)",
        "Function Calling",
        "Voice Synthesis (TTS)",
        "AI-Directed Content Creation",
        "Multi-Client Server Architecture"
      ],
      "technicalDetails": [
        "ElevenLabs API",
        "Claude Desktop as a host",
        "SvelteKit for the custom web client",
        "Cline (VS Code Extension) as a client",
        "Custom-built 'Audio Player' MCP server"
      ],
      "visualElements": [
        "The 'Hammer Icon' in Claude Desktop showing active tools.",
        "Claude's step-by-step process of checking voices before writing the script.",
        "A custom SvelteKit UI playing back the generated 'Happy Protocol' story."
      ],
      "summary": "This tutorial showcases the power of the Model Context Protocol by building an AI audiobook generator. It highlights how a single MCP server can enable multiple AI clients to generate and play high-quality audio using ElevenLabs without traditional API boilerplate."
    }
  },
  {
    index: 498,
    videoId: 'SSVVYylLiLw',
    title: 'Pydantic AI: Build Production Grade Applications',
    url: 'https://www.youtube.com/watch?v=SSVVYylLiLw',
    analysis: {
      "keyPoints": [
        "PydanticAI is a new framework designed for 'Production-Grade' AI agents with strict type safety.",
        "It leverages Pydantic for data validation, ensuring that AI responses match the expected schema every time.",
        "The framework is designed to be model-agnostic, supporting OpenAI, Anthropic, and Gemini easily.",
        "Emphasis on testing, observability, and structured outputs for reliable software systems."
      ],
      "aiConcepts": [
        "Type-Safe AI Agents",
        "Structured Outputs",
        "Model-Agnostic Design",
        "Data Validation",
        "Production AI Workflows"
      ],
      "technicalDetails": [
        "Pydantic V2",
        "PydanticAI framework",
        "Python Type Hints",
        "Integration with Logfire for observability",
        "Support for streaming and dependency injection"
      ],
      "visualElements": [
        "Code walkthroughs defining agent logic with Python decorators.",
        "Demonstration of schema validation errors being caught at runtime.",
        "Comparison charts of PydanticAI vs. other agent frameworks like LangChain."
      ],
      "summary": "This video introduces PydanticAI, a framework from the creators of Pydantic aimed at making AI agent development as reliable as standard web development. It focuses on how type safety and structured outputs are the keys to moving AI agents from experiments to production."
    }
  },
  {
    index: 499,
    videoId: 'P96ShOsv5Ls',
    title: 'PydanticAI: How To Code New "Safe" AI Agents',
    url: 'https://www.youtube.com/watch?v=P96ShOsv5Ls',
    analysis: {
      "keyPoints": [
        "Deep dive into the coding patterns of PydanticAI for creating 'safe' and predictable agents.",
        "Using Dependency Injection to pass database connections or state into the AI agent securely.",
        "The importance of 'System Prompts' and 'Tools' defined via Python functions and Pydantic models.",
        "How to handle multi-turn conversations while maintaining structured state."
      ],
      "aiConcepts": [
        "Safe AI Interaction",
        "Dependency Injection in Agents",
        "Schema-Driven Prompting",
        "State Management"
      ],
      "technicalDetails": [
        "Python Async/Await patterns",
        "Agent class definitions in PydanticAI",
        "Usage of 'RunContext' for managing agent state",
        "Pydantic model validation for tool arguments"
      ],
      "visualElements": [
        "Live coding session building a customer support agent.",
        "Visualizing the data flow between a mock database and the AI agent.",
        "Debugging process showing how the agent handles unexpected user input through strict typing."
      ],
      "summary": "A technical deep dive into building 'safe' AI agents using the PydanticAI library. The video focuses on practical implementation details, showing developers how to use Python's type system to constrain and guide AI behavior for more predictable results."
    }
  },
  {
    index: 516,
    videoId: 'OOrCU9rwedw',
    title: 'The Perfect Bolt-based AI Development Workflow (Part 1)',
    url: 'https://www.youtube.com/watch?v=OOrCU9rwedw',
    analysis: {
      "keyPoints": [
        "Bolt is powerful for initial prototyping but has limitations like high token costs and 'whole-file' code overwrites.",
        "The 'Perfect Workflow' combines Bolt with local IDEs (Cursor) and surgical AI tools (Aider) to maintain code quality.",
        "Key strategy: Exporting Bolt projects to GitHub immediately to track changes and enable professional collaboration.",
        "Uses a 'Sync Script' to automatically extract Bolt's zip downloads and commit them to a local Git repository."
      ],
      "aiConcepts": [
        "AI Development Workflow",
        "Code Generation Limitations",
        "Continuous Improvement Cycle",
        "Surgical vs. Generative Code Changes"
      ],
      "technicalDetails": [
        "Bolt.new / StackBlitz",
        "Cursor (VS Code fork)",
        "Aider (CLI AI coding tool)",
        "Cline (VS Code Extension)",
        "Custom Python/Bash 'Sync' scripts for automated Git commits"
      ],
      "visualElements": [
        "Workflow diagram showing the cycle from Bolt -> GitHub -> Local IDE -> Production.",
        "Live demonstration of generating a component architecture in Claude and importing it into Bolt.",
        "Screencast of the automated zip-to-git sync process in the terminal."
      ],
      "summary": "This video details a professional workflow for using the Bolt AI web development tool without falling into the 'garbage code' trap. It explains how to integrate Bolt with GitHub, Cursor, and Aider to create a scalable and cost-effective development environment."
    }
  },
  {
    index: 559,
    videoId: 'xdAKa8jFx3g',
    title: 'The CORE IDEA of AI Agents Explained',
    url: 'https://www.youtube.com/watch?v=xdAKa8jFx3g',
    analysis: {
      "keyPoints": [
        "An AI Agent is defined as: Perception + Reasoning + Planning + Action + Memory.",
        "The core shift is from 'Large Models' (monolithic) to 'Little Minions' (specialized agents) working together.",
        "Multi-agent systems offer robustness; the failure of one specialized minion doesn't break the entire coordination.",
        "Complexity can often be solved by decomposing a single hard task into multiple simple, pre-trained tasks."
      ],
      "aiConcepts": [
        "Agentic Loops",
        "Swarm Intelligence / Multi-Agent Systems",
        "Task Decomposition",
        "Self-Reflection and Self-Optimization",
        "Emergent Behavior"
      ],
      "technicalDetails": [
        "Plain Python implementation of agent loops",
        "Retrieval Augmented Generation (RAG) as a tool",
        "Hugging Face Unified Tool Use API",
        "Comparison of LangChain vs. Pure Python coding"
      ],
      "visualElements": [
        "Conversational walk-through with Gemini 1.5 Pro to define agent components.",
        "Simple Python code blocks illustrating 'Perceive', 'Reason', and 'Act' functions.",
        "Diagram of a 'Coordinator Agent' delegating tasks to 'Flight', 'Hotel', and 'Activity' minions."
      ],
      "summary": "This comprehensive guide breaks down the transition from static LLMs to dynamic AI Agents. It emphasizes that the future of AI lies in 'Minion' agents—small, specialized, and highly efficient units that collaborate to solve complex real-world problems through task decomposition."
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
  console.log('🎨 Converting Gemini Personal Intelligence responses to reports\n');

  // Ensure reports directory exists
  if (!fs.existsSync(REPORTS_DIR)) {
    console.log(`📁 Creating reports directory: ${REPORTS_DIR}`);
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  let created = 0;
  let skipped = 0;

  for (const video of videos) {
    const filename = `api_${video.index}_${video.videoId}.md`;
    const filepath = path.join(REPORTS_DIR, filename);

    // Check if report already exists
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  Skipped #${video.index}: ${filename} (already exists)`);
      skipped++;
      continue;
    }

    // Generate and save report
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

  // Count total reports
  const allReports = fs.readdirSync(REPORTS_DIR).filter(f => f.endsWith('.md'));
  console.log(`📚 Total reports in directory: ${allReports.length}/647\n`);
}

main();
