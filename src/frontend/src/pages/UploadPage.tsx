import { ArticleCard } from "@/components/ArticleCard";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitArticle } from "@/hooks/useSubmitArticle";
import { type Article, CATEGORIES } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Circle,
  FileText,
  Send,
  Upload,
  X,
} from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";

const MIN_TITLE = 10;
const MIN_CONTENT = 100;

const SPAM_KEYWORDS = [
  "buy now",
  "click here",
  "free offer",
  "limited time",
  "act now",
  "guaranteed",
  "make money fast",
  "100% free",
];

function detectSpam(text: string): string[] {
  const lower = text.toLowerCase();
  return SPAM_KEYWORDS.filter((kw) => lower.includes(kw));
}

function buildPreviewArticle(
  title: string,
  content: string,
  category: string,
): Article {
  return {
    id: "preview",
    title: title || "Your Article Title",
    content: content || "Your article content will appear here in the preview.",
    category: category || "Technology",
    imageUrl: "https://picsum.photos/seed/preview/800/450",
    author: "You",
    publishedAt: new Date().toISOString(),
    likeCount: 0,
    tags: [],
  };
}

function GuidelineRow({ label, met }: { label: string; met: boolean | null }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {met === null ? (
        <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
      ) : met ? (
        <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
      ) : (
        <X className="h-4 w-4 text-destructive shrink-0" />
      )}
      <span
        className={
          met === null
            ? "text-muted-foreground/60"
            : met
              ? "text-foreground"
              : "text-destructive"
        }
      >
        {label}
      </span>
    </li>
  );
}

interface SuccessStateProps {
  articleId: string;
  onSubmitAnother: () => void;
}

function SuccessState({ articleId, onSubmitAnother }: SuccessStateProps) {
  const navigate = useNavigate();
  return (
    <Layout showSidebar={false}>
      <div
        className="max-w-lg mx-auto px-4 py-24 flex flex-col items-center gap-6 text-center"
        data-ocid="upload.success_state"
      >
        <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-accent" />
        </div>
        <div>
          <h2 className="font-display font-bold text-2xl text-foreground mb-2">
            Article Published!
          </h2>
          <p className="text-sm text-muted-foreground mb-1">
            Your article has been validated and added to the recommendation
            system.
          </p>
          <p className="text-xs text-muted-foreground/70">
            Article ID:{" "}
            <span className="font-mono text-accent">{articleId}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() =>
              void navigate({ to: "/articles/$id", params: { id: articleId } })
            }
            className="gap-2"
            data-ocid="upload.view_article_button"
          >
            <BookOpen className="h-3.5 w-3.5" />
            View Article
          </Button>
          <Button
            onClick={onSubmitAnother}
            className="gap-2"
            data-ocid="upload.submit_another_button"
          >
            <Upload className="h-3.5 w-3.5" />
            Submit Another
          </Button>
        </div>
      </div>
    </Layout>
  );
}

export function UploadPage() {
  const { submit, isSubmitting, error, result, clearError } =
    useSubmitArticle();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const titleTouched = title.length > 0;
  const contentTouched = content.length > 0;
  const categoryTouched = category.length > 0;

  const titleMet = titleTouched ? title.trim().length >= MIN_TITLE : null;
  const contentMet = contentTouched
    ? content.trim().length >= MIN_CONTENT
    : null;
  const categoryMet = categoryTouched ? true : null;
  const spamHits = useMemo(
    () => detectSpam(`${title} ${content}`),
    [title, content],
  );
  const noSpamMet =
    titleTouched || contentTouched ? spamHits.length === 0 : null;

  const parsedTags = useMemo(
    () =>
      tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    [tags],
  );

  const previewArticle = useMemo(
    () => buildPreviewArticle(title, content, category),
    [title, content, category],
  );

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!title.trim() || title.trim().length < MIN_TITLE)
      errors.title = `Title must be at least ${MIN_TITLE} characters.`;
    if (!content.trim() || content.trim().length < MIN_CONTENT)
      errors.content = `Content must be at least ${MIN_CONTENT} characters (currently ${content.trim().length}).`;
    if (!category) errors.category = "Please select a category.";
    if (spamHits.length > 0)
      errors.content = `Spam keywords detected: ${spamHits.join(", ")}`;
    return errors;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    clearError();
    const errors = validate();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    submit({
      title: title.trim(),
      content: content.trim(),
      category,
      tags: parsedTags,
    });
  };

  const handleReset = () => {
    setTitle("");
    setContent("");
    setCategory("");
    setTags("");
    setFieldErrors({});
    setSubmitted(false);
    clearError();
  };

  if (result?.kind === "success") {
    return (
      <SuccessState
        articleId={result.articleId}
        onSubmitAnother={handleReset}
      />
    );
  }

  const backendError =
    error ?? (result?.kind === "failure" ? result.reason : null);

  return (
    <Layout showSidebar={false}>
      <div className="border-b border-border bg-card px-4 sm:px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h1
              className="font-display font-bold text-xl text-foreground"
              data-ocid="upload.page"
            >
              Submit an Article
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Articles are validated for quality before being added to the
              recommendation engine.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        {backendError && (
          <div
            className="flex items-start gap-3 p-4 mb-6 bg-destructive/8 border border-destructive/30 rounded-md"
            data-ocid="upload.error_state"
          >
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-destructive mb-0.5">
                Submission failed
              </p>
              <p className="text-sm text-destructive/90">{backendError}</p>
            </div>
            <button
              type="button"
              aria-label="Dismiss error"
              onClick={clearError}
              className="text-destructive/60 hover:text-destructive transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_300px] gap-6 xl:gap-8">
          {/* Guidelines */}
          <aside
            className="hidden lg:block"
            data-ocid="upload.guidelines_panel"
          >
            <div className="bg-card border border-border rounded-md p-4 sticky top-6">
              <h2 className="font-display font-semibold text-sm text-foreground mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-accent" /> Requirements
              </h2>
              <ul className="flex flex-col gap-2.5">
                <GuidelineRow
                  label={`Title ≥ ${MIN_TITLE} chars`}
                  met={titleMet}
                />
                <GuidelineRow
                  label={`Content ≥ ${MIN_CONTENT} chars`}
                  met={contentMet}
                />
                <GuidelineRow label="Category selected" met={categoryMet} />
                <GuidelineRow label="No spam keywords" met={noSpamMet} />
              </ul>
              {spamHits.length > 0 && (
                <div className="mt-3 p-2 bg-destructive/8 border border-destructive/20 rounded-sm">
                  <p className="text-[10px] font-semibold text-destructive mb-1">
                    Detected:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {spamHits.map((kw) => (
                      <span
                        key={kw}
                        className="text-[9px] font-mono bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-sm border border-destructive/20"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-5 pt-4 border-t border-border">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Submitted articles are reviewed by our NLP pipeline before
                  being added to the recommendation system.
                </p>
              </div>
            </div>
          </aside>

          {/* Form */}
          <section>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-5"
              noValidate
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="upload-title" className="text-sm font-medium">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <span
                    className={`text-[10px] font-mono tabular-nums ${title.trim().length >= MIN_TITLE ? "text-accent" : titleTouched ? "text-destructive" : "text-muted-foreground/50"}`}
                  >
                    {title.length} chars
                  </span>
                </div>
                <Input
                  id="upload-title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (fieldErrors.title)
                      setFieldErrors((p) => ({ ...p, title: "" }));
                  }}
                  placeholder="Enter a descriptive article title…"
                  className={`h-10 ${submitted && fieldErrors.title ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
                  data-ocid="upload.title_input"
                />
                {fieldErrors.title && (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="upload.title_field_error"
                  >
                    {fieldErrors.title}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={category}
                  onValueChange={(v) => {
                    setCategory(v);
                    if (fieldErrors.category)
                      setFieldErrors((p) => ({ ...p, category: "" }));
                  }}
                >
                  <SelectTrigger
                    className={`h-10 ${submitted && fieldErrors.category ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
                    data-ocid="upload.category_select"
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.category && (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="upload.category_field_error"
                  >
                    {fieldErrors.category}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="upload-tags" className="text-sm font-medium">
                  Tags{" "}
                  <span className="text-muted-foreground text-[11px] font-normal">
                    (optional, comma-separated)
                  </span>
                </Label>
                <Input
                  id="upload-tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. AI, machine learning, neural networks"
                  className="h-10"
                  data-ocid="upload.tags_input"
                />
                {parsedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-0.5">
                    {parsedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px] font-mono h-5 px-2 rounded-sm bg-accent/10 text-accent border border-accent/25"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="upload-content"
                    className="text-sm font-medium"
                  >
                    Article Content <span className="text-destructive">*</span>
                  </Label>
                  <span
                    className={`text-[10px] font-mono tabular-nums ${content.trim().length >= MIN_CONTENT ? "text-accent" : contentTouched ? "text-destructive" : "text-muted-foreground/50"}`}
                  >
                    {content.length} / {MIN_CONTENT} chars
                  </span>
                </div>
                <Textarea
                  id="upload-content"
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (fieldErrors.content)
                      setFieldErrors((p) => ({ ...p, content: "" }));
                  }}
                  placeholder="Write your full article here (minimum 100 characters)…"
                  className={`min-h-[260px] resize-y text-sm leading-relaxed ${submitted && fieldErrors.content ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
                  data-ocid="upload.content_textarea"
                />
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${content.length >= MIN_CONTENT ? "bg-accent" : "bg-destructive/50"}`}
                    style={{
                      width: `${Math.min(100, (content.length / MIN_CONTENT) * 100)}%`,
                    }}
                  />
                </div>
                {fieldErrors.content && (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="upload.content_field_error"
                  >
                    {fieldErrors.content}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2"
                  data-ocid="upload.submit_button"
                >
                  <Send className="h-3.5 w-3.5" />
                  {isSubmitting ? "Submitting…" : "Publish Article"}
                </Button>
                {(title || content || category || tags) && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleReset}
                    className="text-muted-foreground hover:text-foreground gap-1.5"
                    data-ocid="upload.reset_button"
                  >
                    <X className="h-3.5 w-3.5" /> Clear form
                  </Button>
                )}
              </div>
            </form>
          </section>

          {/* Live Preview */}
          <aside className="hidden lg:block" data-ocid="upload.preview_panel">
            <div className="sticky top-6 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Live Preview
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="opacity-90 pointer-events-none select-none">
                <ArticleCard article={previewArticle} />
              </div>
              <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
                This is how your article card will appear in feeds
              </p>
              {parsedTags.length > 0 && (
                <div className="mt-1 p-3 bg-card border border-border rounded-md">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px] font-mono h-5 px-2 rounded-sm bg-accent/10 text-accent border border-accent/25"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
