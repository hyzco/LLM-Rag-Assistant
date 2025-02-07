import AiTools, { ITool, Tool } from "../../modules/aiTools/AiTools";

export default class ContentAiTools extends AiTools<ITool> {
  constructor() {
    super();
    this.initializeRules();
    this.initializeTools();
  }

  private initializeRules(): void {
    const rules: string[] = [
      "THINK LESS ! DO MORE !",
      // Content Idea Generation Rules
      "Ideas must be user-focused, SEO-friendly, and categorized under topics like 'Education', 'E-commerce', 'Social Media', etc.",
      "Generated ideas should be returned only in JSON format like = [{ idea: '...', category: '...', keywords: ['...', '...', '...'] }].",
      "Only return JSON !!! No other explanation, only JSON.",
      "Follow JSON structure always.",

      // Content Production Rules
      "Generated content must adhere to user-defined parameters like word count, tone, and style.",
      "Support multi-language content generation (initially Turkish and English).",
      "Drafts must be saved with watermarks and prevent unauthorized sharing or modification.",
    ];
    rules.forEach((rule) => this.addRule(rule));
  }

  private initializeTools(): void {
    this.addTool(this.createContentIdeaGeneratorTool());
    this.addTool(this.createContentProductionTool());
  }

  private createContentIdeaGeneratorTool(): ITool {
    return new Tool({
      toolName: "content_idea_generator",
      toolDescription: `Generates creative, user-focused, and SEO-friendly content ideas categorized under topics like 'Education', 'E-commerce', 'Social Media', etc. Users can provide a topic and keywords to generate ideas. create 5 ideas and only return JSON, no other explanation.`,
      toolArgs: {
        topic: "",
        keywords: "",
      },
      toolRules: this.listRules(),
    });
  }

  private createContentProductionTool(): ITool {
    return new Tool({
      toolName: "content_production",
      toolDescription: `Creates detailed content based on selected content ideas. Users can define parameters like word count, tone (formal/informal), style (blog post, social media post), and language.`,
      toolArgs: {
        topic: "",
        wordCount: 0,
        tone: "formal", // Options: "formal", "informal"
        style: "blog", // Options: "blog", "social_media", etc.
        language: "en", // Options: "en", "tr", etc.
      },
      toolRules: this.listRules(),
    });
  }
}
