import OpenAI from "openai";
import { db } from "@/server/db";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface MindmapNode {
  id: string;
  type: "domain" | "epic" | "feature" | "component";
  data: {
    label: string;
    description?: string;
  };
  position: { x: number; y: number };
}

interface MindmapEdge {
  id: string;
  source: string;
  target: string;
}

interface Mindmap {
  name: string;
  domain: string;
  data: {
    nodes: MindmapNode[];
    edges: MindmapEdge[];
  };
}

interface PRDContent {
  problemStatement: string;
  userStory: string;
  userFlows: any[];
  routes: any[];
  models: any[];
  components: any[];
  filePaths: string[];
  acceptanceCriteria: string[];
  edgeCases: string[];
  dependencies: string[];
}

class AIService {
  async generateMindmap(idea: string, knowledgeBase?: any): Promise<Mindmap> {
    const contextPrompt = knowledgeBase
      ? `\n\nExisting codebase context:\n- Framework: ${knowledgeBase.framework}\n- Domains: ${knowledgeBase.domains?.join(", ")}\n- Key routes: ${knowledgeBase.routes?.slice(0, 5).join(", ")}`
      : "";

    const prompt = `You are a product planning expert. Given a feature idea, break it down into a structured mindmap with domains, epics, features, and components.

Feature Idea: "${idea}"${contextPrompt}

Generate a JSON response with:
1. Overall feature name
2. Primary domain (e.g., Auth, Billing, Dashboard, Analytics)
3. Mindmap structure with nodes (domains, epics, features, components) and edges

Format:
{
  "name": "Feature Name",
  "domain": "Primary Domain",
  "nodes": [
    {
      "id": "unique-id",
      "type": "domain|epic|feature|component",
      "data": { "label": "Node Label", "description": "Optional description" },
      "position": { "x": 0, "y": 0 }
    }
  ],
  "edges": [
    { "id": "edge-id", "source": "node-id", "target": "node-id" }
  ]
}

Keep it practical and focused. Maximum 15-20 nodes.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message.content;
    if (!content) {
      throw new Error("Failed to generate mindmap");
    }

    const parsed = JSON.parse(content);

    return {
      name: parsed.name,
      domain: parsed.domain,
      data: {
        nodes: parsed.nodes,
        edges: parsed.edges,
      },
    };
  }

  async generatePRD(params: {
    featureName: string;
    featureDescription: string;
    mindmapData?: any;
    knowledgeBase?: any;
    problemStatement?: string;
    userStory?: string;
  }): Promise<PRDContent> {
    const { featureName, featureDescription, mindmapData, knowledgeBase } =
      params;

    const contextPrompt = knowledgeBase
      ? `\n\nCodebase Context:\n- Framework: ${knowledgeBase.framework || "Unknown"}\n- Language: ${knowledgeBase.language || "Unknown"}\n- Existing routes: ${knowledgeBase.routes?.slice(0, 10).join(", ") || "None"}\n- Existing models: ${knowledgeBase.models?.slice(0, 10).join(", ") || "None"}`
      : "";

    const mindmapPrompt = mindmapData
      ? `\n\nMindmap Structure:\n${JSON.stringify(mindmapData, null, 2)}`
      : "";

    const prompt = `You are a senior product manager and technical architect. Generate a comprehensive PRD for the following feature.

Feature: ${featureName}
Description: ${featureDescription}${contextPrompt}${mindmapPrompt}

Generate a detailed PRD with:
1. Problem Statement (why this feature is needed)
2. User Story (as a [user], I want [goal], so that [benefit])
3. User Flows (array of step-by-step flows)
4. Routes (API endpoints and frontend routes with methods, params, responses)
5. Models (database models with fields, types, relationships)
6. Components (UI components with props and locations)
7. File Paths (list of files that need to be created or modified)
8. Acceptance Criteria (testable criteria)
9. Edge Cases (potential issues and how to handle them)
10. Dependencies (what needs to exist first)

Return valid JSON matching this structure:
{
  "problemStatement": "string",
  "userStory": "string",
  "userFlows": [
    {
      "name": "Flow name",
      "steps": ["step 1", "step 2"]
    }
  ],
  "routes": [
    {
      "path": "/api/endpoint",
      "method": "GET|POST|PUT|DELETE",
      "params": {},
      "response": {},
      "description": "What this route does"
    }
  ],
  "models": [
    {
      "name": "ModelName",
      "fields": [
        {
          "name": "fieldName",
          "type": "string|number|boolean|date",
          "required": true,
          "description": "Field purpose"
        }
      ],
      "relationships": []
    }
  ],
  "components": [
    {
      "name": "ComponentName",
      "location": "src/components/path",
      "props": [],
      "description": "Component purpose"
    }
  ],
  "filePaths": ["src/path/to/file.ts"],
  "acceptanceCriteria": ["criteria 1", "criteria 2"],
  "edgeCases": ["edge case 1", "edge case 2"],
  "dependencies": ["dependency 1"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message.content;
    if (!content) {
      throw new Error("Failed to generate PRD");
    }

    return JSON.parse(content);
  }

  async generateExportPrompt(
    prd: any,
    format: "cursor" | "claude" | "markdown"
  ): Promise<string> {
    if (format === "markdown") {
      return this.generateMarkdownExport(prd);
    }

    // Optimize for AI coding tools (Cursor/Claude)
    const prompt = `# Implementation Task: ${prd.feature.name}

## Context
${prd.problemStatement}

## User Story
${prd.userStory}

## Technical Specifications

### Routes to Implement
${JSON.stringify(prd.routes, null, 2)}

### Database Models
${JSON.stringify(prd.models, null, 2)}

### UI Components
${JSON.stringify(prd.components, null, 2)}

### File Changes Required
${prd.filePaths.map((path: string) => `- ${path}`).join("\n")}

## User Flows
${prd.userFlows.map((flow: any, i: number) => `### ${flow.name || `Flow ${i + 1}`}\n${flow.steps?.map((step: string, j: number) => `${j + 1}. ${step}`).join("\n")}`).join("\n\n")}

## Acceptance Criteria
${prd.acceptanceCriteria.map((c: string) => `- [ ] ${c}`).join("\n")}

## Edge Cases to Handle
${prd.edgeCases.map((e: string) => `- ${e}`).join("\n")}

## Dependencies
${prd.dependencies.length > 0 ? prd.dependencies.map((d: string) => `- ${d}`).join("\n") : "None"}

## Implementation Instructions
1. Review the existing codebase structure
2. Implement the database models first
3. Create API routes/endpoints
4. Build UI components
5. Implement user flows
6. Add error handling and edge cases
7. Write tests for acceptance criteria

Please implement this feature following best practices for the detected framework and maintaining consistency with the existing codebase.`;

    return prompt;
  }

  private generateMarkdownExport(prd: any): string {
    return `# PRD: ${prd.feature.name}

## Version ${prd.version}
Status: ${prd.status}

## Problem Statement
${prd.problemStatement}

## User Story
${prd.userStory}

## User Flows
${prd.userFlows.map((flow: any) => `### ${flow.name}\n${flow.steps?.join("\n")}`).join("\n\n")}

## Technical Specifications

### Routes
\`\`\`json
${JSON.stringify(prd.routes, null, 2)}
\`\`\`

### Models
\`\`\`json
${JSON.stringify(prd.models, null, 2)}
\`\`\`

### Components
\`\`\`json
${JSON.stringify(prd.components, null, 2)}
\`\`\`

### File Paths
${prd.filePaths.map((p: string) => `- \`${p}\``).join("\n")}

## Acceptance Criteria
${prd.acceptanceCriteria.map((c: string) => `- [ ] ${c}`).join("\n")}

## Edge Cases
${prd.edgeCases.map((e: string) => `- ${e}`).join("\n")}

## Dependencies
${prd.dependencies.map((d: string) => `- ${d}`).join("\n")}
`;
  }
}

export const aiService = new AIService();
