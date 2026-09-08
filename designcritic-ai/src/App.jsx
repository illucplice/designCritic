import { useEffect, useRef, useState } from "react";
import { Sidebar } from "./components/Sidebar.jsx";
import { Topbar } from "./components/Topbar.jsx";
import { Home } from "./pages/Home.jsx";
import { Analyze } from "./pages/Analyze.jsx";
import { Result } from "./pages/Result.jsx";
import { Compare } from "./pages/Compare.jsx";
import { History } from "./pages/History.jsx";
import { analyzeDesign, checkHealth, ApiError } from "./api.js";
import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_MB, LOADING_MESSAGES, DESIGN_TYPES } from "./constants.js";
import { demoDesigns } from "./demoData.js";
import { useHistory } from "./hooks/useHistory.js";

function validateFile(file, maxFileSizeMb) {
  if (!file) return "Please choose a file.";
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    return "Unsupported file type. Please upload a PNG, JPG, or WEBP image.";
  }
  if (file.size > maxFileSizeMb * 1024 * 1024) {
    return `That file is too large. Please upload an image under ${maxFileSizeMb}MB.`;
  }
  return null;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Couldn't read that file. It may be corrupted."));
    reader.readAsDataURL(file);
  });
}

export function App() {
  const [page, setPage] = useState("home");
  const [selected, setSelected] = useState(null);
  const { history, addToHistory, deleteFromHistory } = useHistory();

  const [mode, setMode] = useState("Professional");
  const [designType, setDesignType] = useState(DESIGN_TYPES[0]);
  const [audience, setAudience] = useState("");
  const [platform, setPlatform] = useState("");
  const [goal, setGoal] = useState("");

  const [drag, setDrag] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [analyzeError, setAnalyzeError] = useState(null);

  const [saved, setSaved] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState("checking");
  // Fallback used until the backend's actual configured limit is fetched
  // (or if that fetch fails) — kept in sync with the backend's default via
  // constants.js, but the backend's /api/health response is authoritative.
  const [maxFileSizeMb, setMaxFileSizeMb] = useState(MAX_FILE_SIZE_MB);

  const fileRef = useRef();
  const abortRef = useRef(null);
  const stepIntervalRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    checkHealth(controller.signal).then((res) => {
      setAiStatus(res.ok && res.aiConfigured ? "online" : "offline");
      if (res.ok && typeof res.maxUploadMb === "number" && res.maxUploadMb > 0) {
        setMaxFileSizeMb(res.maxUploadMb);
      }
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
    };
  }, []);

  const current = selected || demoDesigns[0];

  async function onFileSelected(file) {
    if (!file) return;
    const error = validateFile(file, maxFileSizeMb);
    if (error) {
      setUploadError(error);
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setImageFile(file);
      setImagePreview(dataUrl);
      setUploadError(null);
    } catch (err) {
      setUploadError(err.message);
    }
  }

  function onRemoveImage() {
    setImageFile(null);
    setImagePreview(null);
    setUploadError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function onReplaceImage() {
    if (loading) return;
    onRemoveImage();
    setSelected(null);
    setPage("upload");
    window.setTimeout(() => fileRef.current?.click(), 0);
  }

  async function onAnalyze() {
    if (loading) return; // prevent duplicate requests from rapid clicks
    if (!imageFile) {
      setUploadError("Please upload a design before analyzing.");
      return;
    }

    setAnalyzeError(null);
    setLoading(true);
    setLoadingStep(0);

    const controller = new AbortController();
    abortRef.current = controller;
    stepIntervalRef.current = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_MESSAGES.length - 1));
    }, 1800);

    try {
      const { analysis } = await analyzeDesign({
        file: imageFile,
        mode,
        designType,
        audience,
        platform,
        goal,
        signal: controller.signal,
      });

      const record = {
        id: "analysis-" + Date.now(),
        title: designType ? `${designType} Critique` : "Design Critique",
        designType,
        mode,
        image: imagePreview,
        createdAt: new Date().toISOString(),
        analysis,
        isDemo: false,
      };

      addToHistory(record);
      setSelected(record);
      setSaved(false);
      setPage("result");
    } catch (err) {
      if (err.name === "AbortError") return;
      const message = err instanceof ApiError ? err.message : "Unable to analyze your design right now. Please try again in a moment.";
      setAnalyzeError(message);
    } finally {
      setLoading(false);
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
      abortRef.current = null;
    }
  }

  return (
    <div className="app">
      <Sidebar page={page} setPage={setPage} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main className="main">
        <Topbar page={page} setMobileOpen={setMobileOpen} aiStatus={aiStatus} />

        {page === "home" && <Home setPage={setPage} setSelected={setSelected} />}

        {page === "upload" && (
          <Analyze
            image={imagePreview}
            drag={drag}
            setDrag={setDrag}
            fileRef={fileRef}
            onFileSelected={onFileSelected}
            onRemoveImage={onRemoveImage}
            maxFileSizeMb={maxFileSizeMb}
            mode={mode}
            setMode={setMode}
            designType={designType}
            setDesignType={setDesignType}
            audience={audience}
            setAudience={setAudience}
            platform={platform}
            setPlatform={setPlatform}
            goal={goal}
            setGoal={setGoal}
            onAnalyze={onAnalyze}
            loading={loading}
            loadingStep={loadingStep}
            uploadError={uploadError || analyzeError}
            clearUploadError={() => {
              setUploadError(null);
              setAnalyzeError(null);
            }}
          />
        )}

        {page === "result" && (
          <Result
            current={current}
            saved={saved}
            setSaved={setSaved}
            setPage={setPage}
            onReplaceImage={onReplaceImage}
          />
        )}

        {page === "compare" && <Compare history={history} />}

        {page === "history" && (
          <History history={history} setSelected={setSelected} setPage={setPage} deleteHistory={deleteFromHistory} />
        )}
      </main>
    </div>
  );
}
