import { useState } from "react";
import InnerNav from "../components/layout/InnerNav";
import Button from "../components/ui/Button";

type ContributeState = "form" | "preview" | "success";
type ContributeType = "资料" | "经验";

interface ContributePageProps {
  state: ContributeState;
  onNavigate: (page: string, state?: string) => void;
  onSearch: (q: string) => void;
  onStateChange: (s: ContributeState) => void;
  isLoggedIn?: boolean;
  username?: string;
  onLogin?: () => void;
  onLogout?: () => void;
}

interface MaterialForm {
  title: string;
  intro: string;
  category: string;
  stage: string;
  sourceUrl: string;
  note: string;
}

interface ExperienceForm {
  title: string;
  background: string;
  body: string;
  audience: string;
  tips: string;
  link: string;
}

const CATEGORIES = ["请选择", "课程", "竞赛", "升学", "就业", "路线", "其他"];
const STAGES = ["请选择", "大一", "大二", "大三", "大四", "研究生", "不限"];

export default function ContributePage({ state, onNavigate, onSearch, onStateChange, isLoggedIn, username, onLogin, onLogout }: ContributePageProps) {
  const [contributeType, setContributeType] = useState<ContributeType>("资料");
  const [aiLoading, setAiLoading] = useState(false);

  const [matForm, setMatForm] = useState<MaterialForm>({
    title: "", intro: "", category: "请选择", stage: "请选择", sourceUrl: "", note: "",
  });
  const [expForm, setExpForm] = useState<ExperienceForm>({
    title: "", background: "", body: "", audience: "", tips: "", link: "",
  });

  const handleAiOrganize = () => {
    setAiLoading(true);
    setTimeout(() => {
      if (contributeType === "资料") {
        setMatForm((prev) => ({
          ...prev,
          title: prev.title || "Web 前端零基础学习资源合集",
          intro: prev.intro || "适合计算机大一新生的前端入门资源清单，覆盖 HTML/CSS/JavaScript 基础，含推荐学习路径与参考项目。",
          category: "路线",
          stage: "大一",
          note: prev.note || "来源包括 MDN 官方文档、FreeCodeCamp 认证课程及南林同学整理的实践项目清单。",
        }));
      } else {
        setExpForm((prev) => ({
          ...prev,
          title: prev.title || "大二参加蓝桥杯的备赛经验",
          background: prev.background || "大二上学期首次参加蓝桥杯省赛，此前只有 C 语言基础，准备时间约两个月。",
          body: prev.body || "备赛分为三个阶段：第一阶段刷基础算法题，第二阶段研究历年真题，第三阶段模拟考试练习时间管理。最终取得省赛三等奖。",
          audience: prev.audience || "适合有基础编程经验、首次参加算法竞赛的同学",
          tips: prev.tips || "不要死磕难题，先把中等难度做熟；时间管理比算法本身更重要。",
        }));
      }
      setAiLoading(false);
    }, 1600);
  };

  // ─── Success state ────────────────────────────────────
  if (state === "success") {
    return (
      <div className="min-h-screen bg-[var(--color-paper)] flex flex-col">
        <InnerNav currentPage="contribute" onNavigate={onNavigate} onSearch={onSearch} isLoggedIn={isLoggedIn} username={username} onLogin={onLogin} onLogout={onLogout} />
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-[rgba(181,38,44,0.08)] flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-crimson)" strokeWidth="2">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h2 className="font-serif font-bold text-3xl text-[var(--color-ink)]">已收到你的贡献，感谢！</h2>
          <p className="text-base text-[rgba(23,23,25,0.6)] font-body max-w-md">
            你的{contributeType === "资料" ? "资料" : "经验"}已成功提交，感谢你为南林计算机人留下宝贵内容。
          </p>
          <div className="flex gap-4 mt-2">
            <Button variant="secondary" onClick={() => onStateChange("form")}>继续贡献</Button>
            <Button variant="primary" onClick={() => onNavigate("discover")}>去发现</Button>
          </div>
        </div>
      </div>
    );
  }

  const isFormValid = contributeType === "资料"
    ? matForm.title.trim() && matForm.intro.trim()
    : expForm.title.trim() && expForm.body.trim();

  const handleSubmit = () => {
    if (!isFormValid) return;
    onStateChange("success");
  };

  // ─── Preview state ────────────────────────────────────
  if (state === "preview") {
    const previewTitle = contributeType === "资料" ? matForm.title : expForm.title;
    const previewBody = contributeType === "资料"
      ? `${matForm.intro}\n\n分类：${matForm.category}  适用阶段：${matForm.stage}\n\n${matForm.note}`
      : `${expForm.background}\n\n${expForm.body}\n\n适合谁：${expForm.audience}\n\n关键建议：${expForm.tips}`;

    return (
      <div className="min-h-screen bg-[var(--color-paper)] flex flex-col">
        <InnerNav currentPage="contribute" onNavigate={onNavigate} onSearch={onSearch} isLoggedIn={isLoggedIn} username={username} onLogin={onLogin} onLogout={onLogout} />
        <main className="max-w-3xl mx-auto w-full px-[clamp(24px,4vw,64px)] py-10 flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-2xl text-[var(--color-ink)]">预览</h2>
            <Button variant="text" onClick={() => onStateChange("form")}>← 返回编辑</Button>
          </div>

          <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-card)] p-8 flex flex-col gap-4">
            <span className="px-3 py-1 rounded-full text-xs font-medium font-body bg-[rgba(23,23,25,0.07)] w-fit">
              {contributeType === "资料" ? matForm.category : "经验"}
            </span>
            <h3 className="font-serif font-bold text-2xl text-[var(--color-ink)]">{previewTitle || "（未填写标题）"}</h3>
            <div className="text-base text-[rgba(23,23,25,0.75)] font-body leading-relaxed whitespace-pre-line">
              {previewBody || "（未填写内容）"}
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="secondary" onClick={() => onStateChange("form")}>返回编辑</Button>
            <Button variant="primary" onClick={handleSubmit}>提交贡献</Button>
          </div>
        </main>
      </div>
    );
  }

  // ─── Form state ────────────────────────────────────────
  const inputClass = "w-full px-4 py-3 bg-white border border-[var(--color-border)] rounded-[var(--radius-ctrl)] text-sm font-body text-[var(--color-ink)] placeholder:text-[rgba(23,23,25,0.35)] focus:outline-none focus:border-[var(--color-ink)] transition-colors";
  const labelClass = "text-sm font-medium font-body text-[var(--color-ink)] mb-1.5 block";

  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex flex-col">
      <InnerNav currentPage="contribute" onNavigate={onNavigate} onSearch={onSearch} isLoggedIn={isLoggedIn} username={username} onLogin={onLogin} onLogout={onLogout} />

      <main className="max-w-3xl mx-auto w-full px-[clamp(24px,4vw,64px)] py-10 flex flex-col gap-8">
        {/* Header */}
        <div>
          <h1 className="font-serif font-bold text-3xl text-[var(--color-ink)]">
            把你的经验，留给下一位同学
          </h1>
          <p className="text-base text-[rgba(23,23,25,0.55)] font-body mt-2">
            每一份资料和经验，都能帮助更多南林计算机人少走弯路。
          </p>
        </div>

        {/* Type switcher */}
        <div className="flex border border-[var(--color-border)] rounded-[var(--radius-ctrl)] overflow-hidden w-fit">
          {(["资料", "经验"] as ContributeType[]).map((t) => (
            <button
              key={t}
              onClick={() => setContributeType(t)}
              className={`px-6 py-2.5 text-sm font-medium font-body transition-all ${
                contributeType === t
                  ? "bg-[var(--color-ink)] text-[var(--color-paper)]"
                  : "text-[var(--color-ink)] hover:bg-[rgba(23,23,25,0.04)]"
              }`}
            >
              贡献{t}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="flex flex-col gap-5">
          {contributeType === "资料" ? (
            <>
              <div><label className={labelClass}>标题 *</label>
                <input type="text" className={inputClass} value={matForm.title} onChange={(e) => setMatForm({ ...matForm, title: e.target.value })} placeholder="资料的完整标题" />
              </div>
              <div><label className={labelClass}>简介 *</label>
                <textarea rows={3} className={`${inputClass} resize-none`} value={matForm.intro} onChange={(e) => setMatForm({ ...matForm, intro: e.target.value })} placeholder="用 2–3 句话介绍这份资料的内容和价值" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>分类</label>
                  <select className={inputClass} value={matForm.category} onChange={(e) => setMatForm({ ...matForm, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className={labelClass}>适用阶段</label>
                  <select className={inputClass} value={matForm.stage} onChange={(e) => setMatForm({ ...matForm, stage: e.target.value })}>
                    {STAGES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div><label className={labelClass}>来源链接</label>
                <input type="url" className={inputClass} value={matForm.sourceUrl} onChange={(e) => setMatForm({ ...matForm, sourceUrl: e.target.value })} placeholder="https://" />
              </div>
              <div className="border border-dashed border-[var(--color-border-strong)] rounded-[var(--radius-ctrl)] p-4 flex items-center gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[rgba(23,23,25,0.4)]">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-sm text-[rgba(23,23,25,0.45)] font-body">上传附件（原型演示，不含真实上传）</span>
              </div>
              <div><label className={labelClass}>补充说明</label>
                <textarea rows={2} className={`${inputClass} resize-none`} value={matForm.note} onChange={(e) => setMatForm({ ...matForm, note: e.target.value })} placeholder="来源说明、注意事项等（选填）" />
              </div>
            </>
          ) : (
            <>
              <div><label className={labelClass}>标题 *</label>
                <input type="text" className={inputClass} value={expForm.title} onChange={(e) => setExpForm({ ...expForm, title: e.target.value })} placeholder="经验的标题，例如：大二备战蓝桥杯全记录" />
              </div>
              <div><label className={labelClass}>经历背景</label>
                <textarea rows={2} className={`${inputClass} resize-none`} value={expForm.background} onChange={(e) => setExpForm({ ...expForm, background: e.target.value })} placeholder="你当时的年级、基础和目标" />
              </div>
              <div><label className={labelClass}>正文 *</label>
                <textarea rows={5} className={`${inputClass} resize-none`} value={expForm.body} onChange={(e) => setExpForm({ ...expForm, body: e.target.value })} placeholder="详细描述你的经历和收获…" />
              </div>
              <div><label className={labelClass}>适合谁看</label>
                <input type="text" className={inputClass} value={expForm.audience} onChange={(e) => setExpForm({ ...expForm, audience: e.target.value })} placeholder="例如：有一定基础、想参加算法竞赛的同学" />
              </div>
              <div><label className={labelClass}>关键建议</label>
                <textarea rows={2} className={`${inputClass} resize-none`} value={expForm.tips} onChange={(e) => setExpForm({ ...expForm, tips: e.target.value })} placeholder="最想对后来者说的 1–3 条建议" />
              </div>
              <div><label className={labelClass}>相关链接</label>
                <input type="url" className={inputClass} value={expForm.link} onChange={(e) => setExpForm({ ...expForm, link: e.target.value })} placeholder="https://" />
              </div>
            </>
          )}
        </div>

        {/* AI organize button */}
        <Button
          variant="secondary"
          onClick={handleAiOrganize}
          disabled={aiLoading}
          className="w-fit"
        >
          {aiLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              AI 整理中…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
              </svg>
              AI 帮我整理
            </>
          )}
        </Button>

        {/* Footer actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-[var(--color-border)]">
          <Button variant="text" size="sm" onClick={() => {}}>保存草稿</Button>
          <div className="flex gap-3 ml-auto">
            <Button variant="secondary" onClick={() => onStateChange("preview")}>预览</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={!isFormValid}>
              提交贡献
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
