import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- API Base URLs ---
const API_BASE = 'http://localhost:8080/api';
const PROBLEMS_API_URL = `${API_BASE}/problems`;
const LINKS_API_URL = `${API_BASE}/links`;
const USERS_API_URL = `${API_BASE}/users`;

// --- Helper Functions for Dates ---
const SR_INTERVALS_DAYS = [2, 3, 5, 7, 11, 20, 30];

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function getNextRevisionDate(revisionLevel, baseDate = Date.now()) {
  if (revisionLevel >= SR_INTERVALS_DAYS.length) return null;
  const daysToAdd = SR_INTERVALS_DAYS[revisionLevel];
  const newDate = new Date(baseDate);
  newDate.setDate(newDate.getDate() + daysToAdd);
  return newDate.toISOString().split('T')[0];
}

// --- Constants ---
const PROBLEM_SOURCES = ["LeetCode", "Codeforces", "AtCoder", "HackerRank", "Other"];
const PROBLEM_DIFFICULTIES = ["Easy", "Medium", "Hard"];
const ACCENT_COLORS = [
  { name: 'Blue', hue: '210' },
  { name: 'Green', hue: '145' },
  { name: 'Red', hue: '350' },
  { name: 'Purple', hue: '260' },
  { name: 'Orange', hue: '30' },
];

// --- Custom Hooks ---
function useLocalStorageState(key, defaultValue) {
  const [state, setState] = useState(() => {
    let value;
    try {
      value = JSON.parse(window.localStorage.getItem(key) || JSON.stringify(defaultValue));
    } catch (e) {
      console.error("Error reading from localStorage", e);
      value = defaultValue;
    }
    return value;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.error("Error writing to localStorage", e);
    }
  }, [key, state]);

  return [state, setState];
}

function useClickOutside(ref, callback) {
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback]);
}

// --- Reusable Glass Button ---
function GlassButton({ onClick, children, className = '', type = 'button', disabled = false }) {
  const isAccent = className.includes('bg-accent-light');
  const accentStyle = isAccent ? {
    backgroundColor: `hsl(var(--accent-hue) 80% 60% / 0.1)`,
    borderColor: `hsl(var(--accent-hue) 80% 60% / 0.3)`,
    color: `hsl(var(--accent-hue) 80% 30%)`,
  } : {};

  return (
    <button
      type={type}
      onClick={onClick}
      style={accentStyle}
      disabled={disabled}
      className={`px-4 py-1.5 text-sm font-medium
                  bg-white/30 backdrop-blur-xl 
                  border border-gray-300/50 
                  rounded-md shadow-lg transition-all 
                  hover:bg-white/50 hover:backdrop-blur-2xl hover:shadow-xl
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${className}`}
    >
      {children}
    </button>
  );
}

// --- Custom Glass Dropdown ---
function GlassDropdown({ label, options, selectedValue, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setIsOpen(false));

  const handleSelect = (option) => {
    const newValue = typeof option === 'object' ? option.value : option;
    onChange(newValue);
    setIsOpen(false);
  };

  let displayLabel = selectedValue;
  const selectedOption = options.find(opt => (typeof opt === 'object' ? opt.value === selectedValue : opt === selectedValue));
  if (selectedOption) {
    displayLabel = typeof selectedOption === 'object' ? selectedOption.label : selectedOption;
  }

  return (
    <div className="relative" ref={ref}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="mt-1 block w-full px-3 py-2 border border-gray-400/30 bg-white/50 text-gray-900 rounded-md text-sm text-left
                   focus:outline-none focus:ring-2 focus:ring-blue-500 flex justify-between items-center"
      >
        <span>{displayLabel}</span>
        <svg className="w-4 h-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white/70 backdrop-blur-xl border border-gray-300/50 rounded-md shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {options.map(option => {
            const label = typeof option === 'object' ? option.label : option;
            const value = typeof option === 'object' ? option.value : option;
            return (
              <div
                key={value}
                onClick={() => handleSelect(option)}
                className={`px-3 py-2 text-sm text-gray-800 cursor-pointer hover:bg-black/10 ${selectedValue === value ? 'bg-black/5 font-bold' : ''}`}
              >
                {label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- GlassInput & Toggle ---
function GlassInput({ label, id, ...props }) {
  return (
    <div className={props.wrapperClass}>
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>}
      <input
        id={id}
        {...props}
        className={`mt-1 block w-full px-3 py-2 border border-gray-400/30 bg-white/50 text-gray-900 rounded-md text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-hue)_80%_60%)] ${props.className || ''}`}
      />
    </div>
  );
}

function GlassToggle({ label, enabled, setEnabled }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => setEnabled(!enabled)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-hue)_80%_60%)] focus:ring-offset-2
                    ${enabled ? 'bg-[hsl(var(--accent-hue)_80%_60%)]' : 'bg-gray-200'}`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

// --- Background Uploader ---
function BackgroundUploader({ onBackgroundChange, onBackgroundClear }) {
  const fileInputRef = useRef(null);
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        onBackgroundChange(e.target.result);
      } catch (err) { console.error("Error reading file:", err); }
    };
    reader.readAsDataURL(file);
  };
  return (
    <div className="flex items-center justify-between gap-4 p-3 bg-white/30 rounded-lg">
      <div>
        <h4 className="font-medium text-gray-800">Background Image</h4>
        <p className="text-xs text-gray-600">Upload a custom image.</p>
      </div>
      <div className="flex gap-3">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        <GlassButton onClick={() => fileInputRef.current && fileInputRef.current.click()}>Upload</GlassButton>
        <GlassButton onClick={onBackgroundClear} className="bg-red-500/10 border-red-500/30 text-red-800 hover:bg-red-500/20">Clear</GlassButton>
      </div>
    </div>
  );
}

// --- SettingsModal ---
function SettingsModal({ 
  isOpen, onClose, customHeading, setCustomHeading, accentHue, setAccentHue, 
  animationsOn, setAnimationsOn, onBackgroundChange, onBackgroundClear, 
  links, handleAddLink, handleDeleteLink, handleChangePassword,
  user // Passed user to show account options only if logged in
}) {
  const modalRef = useRef(null);
  useClickOutside(modalRef, onClose);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newLogo, setNewLogo] = useState("");
  const [headingInput, setHeadingInput] = useState(customHeading);

  if (!isOpen) return null;
  
  const renderLogo = (link) => link.logoSvg ? <span className="w-5 h-5 mr-2" dangerouslySetInnerHTML={{ __html: link.logoSvg }} /> : <span className="w-5 h-5 mr-2 text-gray-600">●</span>;

  const handleAddLinkFormSubmit = async (e) => {
    e.preventDefault();
    await handleAddLink(newName, newUrl, newLogo);
    setNewName(""); setNewUrl(""); setNewLogo(""); setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm anim-fade-in">
      <div ref={modalRef} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-white/70 backdrop-blur-xl border border-gray-300/50 rounded-lg shadow-2xl anim-fade-in-up">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        <div className="space-y-6">
          {user && (
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Account</h3>
               <GlassButton onClick={handleChangePassword} className="bg-red-500/10 border-red-500/30 text-red-800 hover:bg-red-500/20 w-full">
                  Change My Password
               </GlassButton>
            </section>
          )}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Personalize</h3>
            <div className="space-y-3">
              <GlassInput label="Custom Greeting" id="customHeading" type="text" value={headingInput} onChange={(e) => setHeadingInput(e.target.value)} />
              <GlassButton onClick={() => setCustomHeading(headingInput)}>Save Greeting</GlassButton>
            </div>
          </section>
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Appearance</h3>
            <div className="space-y-3">
              <BackgroundUploader onBackgroundChange={onBackgroundChange} onBackgroundClear={onBackgroundClear} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                <div className="flex flex-wrap gap-2">
                  {ACCENT_COLORS.map(color => (
                    <button key={color.name} onClick={() => setAccentHue(color.hue)} className={`w-8 h-8 rounded-full border-2 ${accentHue === color.hue ? 'border-black/50' : 'border-transparent'}`} style={{ backgroundColor: `hsl(${color.hue}, 70%, 60%)` }} title={color.name} />
                  ))}
                </div>
              </div>
              <GlassToggle label="Enable Animations" enabled={animationsOn} setEnabled={setAnimationsOn} />
            </div>
          </section>
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Manage Quick Links</h3>
            <div className="space-y-2">
              {links.map(link => (
                <div key={link.id} className="flex items-center justify-between p-2 bg-white/30 rounded-md">
                  <div className="flex items-center text-sm font-medium text-gray-800">{renderLogo(link)}{link.name}</div>
                  <button onClick={() => handleDeleteLink(link.id)} className="text-red-500 hover:text-red-700 text-xs font-bold">Remove</button>
                </div>
              ))}
            </div>
            <GlassButton onClick={() => setShowAddForm(!showAddForm)} className="mt-3 bg-accent-light border-accent-border text-accent-text hover:bg-accent-light-hover">+ Add New Link</GlassButton>
            {showAddForm && (
              <form onSubmit={handleAddLinkFormSubmit} className="mt-4 p-4 bg-black/5 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-3">
                <GlassInput id="linkName" type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Site Name" required />
                <GlassInput id="linkUrl" type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="Full URL" required />
                <GlassInput id="linkLogo" type="text" value={newLogo} onChange={(e) => setNewLogo(e.target.value)} placeholder="Logo SVG or URL (Optional)" className="md:col-span-2" />
                <div className="md:col-span-2 flex gap-3">
                  <GlassButton type="submit" className="bg-accent-light border-accent-border text-accent-text hover:bg-accent-light-hover">Save Link</GlassButton>
                  <GlassButton onClick={() => setShowAddForm(false)}>Cancel</GlassButton>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// --- ProblemForm ---
function ProblemForm({ onSubmit, onCancel, problemToEdit }) {
  const isEditMode = !!problemToEdit;
  const [source, setSource] = useState(problemToEdit?.source || PROBLEM_SOURCES[0]);
  const [name, setName] = useState(problemToEdit?.name || "");
  const [url, setUrl] = useState(problemToEdit?.url || "");
  const [difficulty, setDifficulty] = useState(problemToEdit?.difficulty || PROBLEM_DIFFICULTIES[0]);
  const [submissionLink, setSubmissionLink] = useState(problemToEdit?.submissionLink || "");
  const [remarks, setRemarks] = useState(problemToEdit?.remarks || "");
  const [rating, setRating] = useState(problemToEdit?.rating || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    onSubmit({ source, name, url, difficulty, submissionLink, remarks, rating: rating ? Number(rating) : null, ...(isEditMode && { id: problemToEdit.id, addedAt: problemToEdit.addedAt, revisionLevel: problemToEdit.revisionLevel, nextRevisionDate: problemToEdit.nextRevisionDate }) });
    if (!isEditMode) { setName(""); setUrl(""); setSubmissionLink(""); setRemarks(""); setRating(""); setSource(PROBLEM_SOURCES[0]); setDifficulty(PROBLEM_DIFFICULTIES[0]); }
  };

  useEffect(() => {
    if (problemToEdit) {
      setSource(problemToEdit.source); setName(problemToEdit.name); setUrl(problemToEdit.url);
      setDifficulty(problemToEdit.difficulty); setSubmissionLink(problemToEdit.submissionLink || "");
      setRemarks(problemToEdit.remarks || ""); setRating(problemToEdit.rating || "");
    }
  }, [problemToEdit]);

  return (
    <div className="mb-6 p-6 bg-white/30 backdrop-blur-xl border border-gray-300/50 rounded-lg shadow-xl anim-fade-in-up">
      <h3 className="text-lg font-bold text-gray-800 mb-4">{isEditMode ? "Edit Problem" : "Add New Problem"}</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="md:col-span-3"><GlassInput label="Problem Name" id="problemName" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Two Sum" required /></div>
        <div className="md:col-span-3"><GlassInput label="Problem URL" id="problemUrl" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" required /></div>
        <div className="md:col-span-2"><GlassDropdown label="Problem Source" options={PROBLEM_SOURCES} selectedValue={source} onChange={setSource} /></div>
        <div className="md:col-span-2"><GlassDropdown label="Problem Difficulty" options={PROBLEM_DIFFICULTIES} selectedValue={difficulty} onChange={setDifficulty} /></div>
        <div className="md:col-span-2"><GlassInput label="Problem Rating" id="problemRating" type="number" value={rating} onChange={(e) => setRating(e.target.value)} placeholder="101+" min={101} /></div>
        <div className="md:col-span-6"><GlassInput label="Submission Link" id="submissionLink" type="url" value={submissionLink} onChange={(e) => setSubmissionLink(e.target.value)} placeholder="https://..." /></div>
        <div className="md:col-span-6"><label htmlFor="remarks" className="block text-sm font-medium text-gray-700">Remarks</label><textarea id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-400/30 bg-white/50 text-gray-900 rounded-md text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-hue)_80%_60%)]" placeholder="Learned about..." /></div>
        <div className="md:col-span-6 flex items-center gap-3"><GlassButton type="submit" className="bg-accent-light border-accent-border text-accent-text hover:bg-accent-light-hover">{isEditMode ? "Update Problem" : "Add Problem"}</GlassButton>{isEditMode && <GlassButton onClick={onCancel}>Cancel</GlassButton>}</div>
      </form>
    </div>
  );
}

// --- ProblemList ---
function ProblemList({ problems, onDeleteProblem, onStartEdit }) {
  if (problems.length === 0) return <div className="text-center text-gray-600">No matching problems found.</div>;
  return (
    <div className="overflow-x-auto bg-white/30 backdrop-blur-xl border border-gray-300/50 rounded-lg shadow-xl anim-fade-in-up">
      <table className="w-full table-auto text-sm">
        <thead className="bg-black/5"><tr>{['Source', 'Problem Name & Remarks', 'Difficulty', 'Rating', 'Next Revision', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-gray-700 font-medium">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-300/50">
          {problems.map((p) => (
            <tr key={p.id} className="hover:bg-black/5 align-top transition-colors hover:shadow-md">
              <td className="px-4 py-3 text-gray-700">{p.source}</td>
              <td className="px-4 py-3 text-gray-900 max-w-sm"><div><a href={p.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">{p.name}</a>{p.submissionLink && <a href={p.submissionLink} target="_blank" rel="noopener noreferrer" className="text-xs ml-2 text-blue-500 hover:underline">[Submission]</a>}</div>{p.remarks && <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{p.remarks}</p>}</td>
              <td className="px-4 py-3 text-gray-700">{p.difficulty}</td>
              <td className="px-4 py-3 text-gray-700">{p.rating || '-'}</td>
              <td className="px-4 py-3 text-gray-700">{p.nextRevisionDate || <span className="text-gray-500">Done</span>}</td>
              <td className="px-4 py-3"><button onClick={() => onStartEdit(p.id)} className="text-blue-600 hover:text-blue-800 text-xs mr-3 font-medium">Edit</button><button onClick={() => onDeleteProblem(p.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- QuickLinksBar ---
function QuickLinksBar({ links, isLoading, error }) {
  const renderLogo = (link) => link.logoSvg ? <span className="w-5 h-5 mr-2" dangerouslySetInnerHTML={{ __html: link.logoSvg }} /> : <span className="w-5 h-5 mr-2 text-gray-600">●</span>;
  return (
    <div className="mb-6 p-4 bg-white/30 backdrop-blur-xl border border-gray-300/50 rounded-lg shadow-xl anim-fade-in-up">
      <div className="flex flex-wrap items-center gap-3">
        {isLoading && <span className="text-sm text-gray-600">Loading links...</span>}
        {error && <span className="text-sm text-red-600">Error loading links</span>}
        {links.map(link => <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="group flex items-center px-3 py-1.5 text-sm text-gray-800 font-medium bg-white/30 backdrop-blur-lg border border-gray-300/50 rounded-md shadow-lg transition-all hover:bg-white/50 hover:shadow-xl hover:scale-105">{renderLogo(link)}{link.name}</a>)}
      </div>
    </div>
  );
}

// --- FilterControls ---
function FilterControls({ filterSource, onFilterSourceChange, filterDifficulty, onFilterDifficultyChange, sortConfig, onSortConfigChange }) {
  const sortOptions = [{ value: "addedAt:desc", label: "Date Added (Newest)" }, { value: "addedAt:asc", label: "Date Added (Oldest)" }, { value: "name:asc", label: "Name (A-Z)" }, { value: "name:desc", label: "Name (Z-A)" }, { value: "rating:desc", label: "Rating (High-Low)" }, { value: "rating:asc", label: "Rating (Low-High)" }, { value: "nextRevisionDate:asc", label: "Revision Date (Soonest)" }, { value: "nextRevisionDate:desc", label: "Revision Date (Latest)" }];
  const currentSortValue = `${sortConfig.key}:${sortConfig.direction}`;
  return (
    <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3 anim-fade-in-up">
      <GlassDropdown label="Filter by Source" options={["All", ...PROBLEM_SOURCES]} selectedValue={filterSource} onChange={onFilterSourceChange} />
      <GlassDropdown label="Filter by Difficulty" options={["All", ...PROBLEM_DIFFICULTIES]} selectedValue={filterDifficulty} onChange={onFilterDifficultyChange} />
      <GlassDropdown label="Sort by" options={sortOptions} selectedValue={currentSortValue} onChange={(value) => { const [key, direction] = value.split(':'); onSortConfigChange({ key, direction }); }} />
    </div>
  );
}

// --- ExportImportControls ---
function ExportImportControls({ problems, onImportData }) {
  const handleExport = () => {
    try { const dataStr = JSON.stringify(problems, null, 2); const blob = new Blob([dataStr], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.download = `cp-compendium-backup-${new Date().toISOString().split('T')[0]}.json`; link.href = url; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); } catch (err) { console.error(err); }
  };
  const handleImport = (event) => {
    const file = event.target.files[0]; if (!file) return; const reader = new FileReader();
    reader.onload = (e) => { try { const imported = JSON.parse(e.target.result); if (Array.isArray(imported)) onImportData(imported); } catch (err) { console.error(err); } event.target.value = null; }; reader.readAsText(file);
  };
  return (
    <div className="mb-4 p-4 bg-white/30 backdrop-blur-xl border border-gray-300/50 rounded-lg shadow-xl grid grid-cols-1 md:grid-cols-2 gap-4 anim-fade-in-up">
      <div><h4 className="font-bold text-gray-900">Export Data</h4><p className="text-xs text-gray-600 mb-2">Save as JSON.</p><GlassButton onClick={handleExport} className="bg-accent-light border-accent-border text-accent-text hover:bg-accent-light-hover">Export All Problems</GlassButton></div>
      <div><h4 className="font-bold text-gray-900">Import Data</h4><p className="text-xs text-gray-600 mb-2">Load JSON.</p><label htmlFor="import-file" className="cursor-pointer px-4 py-1.5 text-sm text-green-800 font-medium bg-green-500/10 backdrop-blur-xl border border-green-500/30 rounded-md shadow-lg transition-all hover:bg-green-500/20 hover:backdrop-blur-2xl hover:shadow-xl inline-block">Import Problems</label><input type="file" id="import-file" accept=".json,application/json" className="hidden" onChange={handleImport} /></div>
    </div>
  );
}

// --- SearchBar ---
function SearchBar({ searchTerm, onSearchChange }) {
  return (
    <div className="mb-4 anim-fade-in-up">
      <GlassInput type="text" value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search by name, source, or difficulty..." />
    </div>
  );
}

// --- RevisionList ---
function RevisionList({ problems, onMarkAsRevised }) {
  const today = getTodayDate();
  const revisionProblems = problems
    .filter(p => p.nextRevisionDate && p.nextRevisionDate <= today)
    .sort((a, b) => new Date(a.nextRevisionDate) - new Date(b.nextRevisionDate));

  if (revisionProblems.length === 0) {
    return (
      <div className="mb-6 p-4 bg-green-500/10 backdrop-blur-xl border border-green-500/30 rounded-lg anim-fade-in-up">
        <h3 className="text-lg font-bold text-green-800">Revision Queue</h3>
        <p className="text-green-700">You're all caught up! No problems to revise today.</p>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 bg-yellow-500/10 backdrop-blur-xl border border-yellow-500/30 rounded-lg anim-fade-in-up">
      <h3 className="text-lg font-bold text-yellow-800">Revision Queue ({revisionProblems.length} Problems Due)</h3>
      <div className="overflow-x-auto mt-3">
        <table className="w-full table-auto border-collapse text-sm">
          <thead className="bg-yellow-500/20">
            <tr>
              <th className="border border-yellow-500/30 px-3 py-1.5 text-left text-yellow-800">Problem</th>
              <th className="border border-yellow-500/30 px-3 py-1.5 text-left text-yellow-800">Due Date</th>
              <th className="border border-yellow-500/30 px-3 py-1.5 text-left text-yellow-800 w-32">Action</th>
            </tr>
          </thead>
          <tbody>
            {revisionProblems.map(problem => (
              <tr key={problem.id} className="hover:bg-yellow-500/10 align-top">
                <td className="border border-yellow-500/30 px-3 py-1.5">
                  <a href={problem.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {problem.name}
                  </a>
                  <span className="text-xs text-gray-600 ml-2">({problem.source})</span>
                </td>
                <td className="border border-yellow-500/30 px-3 py-1.5 text-yellow-700">{problem.nextRevisionDate}</td>
                <td className="border border-yellow-500/30 px-3 py-1.5 text-center">
                  <GlassButton
                    onClick={() => onMarkAsRevised(problem.id)}
                    className="bg-green-500/10 border-green-500/30 text-green-800 hover:bg-green-500/20 text-xs px-3"
                  >
                    Mark as Revised
                  </GlassButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- 7. Main App Component ---
export default function App() {
  // --- Auth State ---
  const [user, setUser] = useLocalStorageState('cp-user', null);

  // --- Main Data State ---
  const [problems, setProblems] = useState([]);
  const [links, setLinks] = useState([]);
  const [isLoadingProblems, setIsLoadingProblems] = useState(false);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [error, setError] = useState(null);
  
  // --- UI State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProblemId, setEditingProblemId] = useState(null);
  const [filterSource, setFilterSource] = useState("All");
  const [filterDifficulty, setFilterDifficulty] = useState("All");
  const [sortConfig, setSortConfig] = useState({ key: 'addedAt', direction: 'desc' });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- Customization State ---
  const [customHeading, setCustomHeading] = useLocalStorageState('cp-heading', 'Competitive Programming Compendium');
  const [accentHue, setAccentHue] = useLocalStorageState('cp-accent-hue', '210');
  const [animationsOn, setAnimationsOn] = useLocalStorageState('cp-animations-on', true);
  const [backgroundUrl, setBackgroundUrl] = useLocalStorageState('cp-background-url', null);
  
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-hue', accentHue);
    document.documentElement.dataset.animations = animationsOn;
  }, [accentHue, animationsOn]);

  // --- API Headers Helper ---
  const getHeaders = useCallback(() => ({ 
    'Content-Type': 'application/json',
    'X-User-Id': user?.id 
  }), [user]);

  // --- Auth Handlers (PRIMITIVE ALERT BASED) ---
  const handleLogin = async () => {
    const username = prompt("Primitive Login\n\nEnter Username:");
    if (!username) return;
    const password = prompt("Enter Password:");
    if (!password) return;

    try {
      const response = await fetch(`${USERS_API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        alert("Login Failed: Invalid credentials or server error.");
        return;
      }
      
      const userData = await response.json();
      
      // FIX: Save directly to localStorage to ensure it persists before UI update
      window.localStorage.setItem('cp-user', JSON.stringify(userData));
      setUser(userData); // Updates state, triggering re-render of authenticated UI
      
    } catch (e) {
      alert("Login Failed: " + e.message);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      setUser(null);
      window.localStorage.removeItem('cp-user');
    }
  };

  const handleChangePassword = async () => {
    const newPass = prompt("Enter your NEW password:");
    if (!newPass) return;
    
    try {
      const response = await fetch(`${USERS_API_URL}/${user.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPass })
      });
      if (response.ok) alert("Password updated successfully!");
      else alert("Failed to update password.");
    } catch (e) { alert("Error: " + e.message); }
  };

  // Handlers for Background
  const handleBackgroundChange = (url) => setBackgroundUrl(url);
  const handleBackgroundClear = () => setBackgroundUrl(null);


  // --- NEW: Auto-Login Trigger on Mount ---
  useEffect(() => {
    // If user is not logged in, wait 500ms then ask for login
    if (!user) {
      const timer = setTimeout(() => {
        handleLogin();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []); // Run once on mount


  // --- Data Fetching Effects ---
  useEffect(() => {
    if (!user) return; 

    const fetchProblems = async () => {
      try {
        setIsLoadingProblems(true);
        const response = await fetch(PROBLEMS_API_URL, { headers: getHeaders() });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setProblems(data);
      } catch (err) { setError(err.message); console.error(err); } finally { setIsLoadingProblems(false); }
    };

    const fetchLinks = async () => {
      try {
        setIsLoadingLinks(true);
        const response = await fetch(LINKS_API_URL, { headers: getHeaders() });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setLinks(data);
      } catch (err) { setError(err.message); console.error(err); } finally { setIsLoadingLinks(false); }
    };

    fetchProblems();
    fetchLinks();
  }, [user, getHeaders]); 


  // --- CRUD Handlers ---
  const handleAddProblem = async (data) => {
    const dto = { name: data.name, url: data.url, source: data.source, difficulty: data.difficulty, rating: data.rating, remarks: data.remarks, submissionLink: data.submissionLink };
    try {
      const res = await fetch(PROBLEMS_API_URL, { method: 'POST', headers: getHeaders(), body: JSON.stringify(dto) });
      if (res.ok) {
        const newP = await res.json();
        setProblems(p => [...p, newP]);
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdateProblem = async (updated) => {
    try {
      const res = await fetch(`${PROBLEMS_API_URL}/${updated.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(updated) });
      if (res.ok) { const saved = await res.json(); setProblems(p => p.map(x => x.id === saved.id ? saved : x)); setEditingProblemId(null); }
    } catch (e) { console.error(e); }
  };

  const handleDeleteProblem = async (id) => {
    if(!window.confirm("Delete this problem?")) return;
    try {
      const res = await fetch(`${PROBLEMS_API_URL}/${id}`, { method: 'DELETE', headers: getHeaders() });
      if (res.ok) setProblems(p => p.filter(x => x.id !== id));
    } catch (e) { console.error(e); }
  };

  const handleImportData = async (imported) => {
    try {
      const res = await fetch(`${PROBLEMS_API_URL}/batch`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(imported) });
      if (res.ok) {
        const newProbs = await res.json();
        setProblems(p => [...p, ...newProbs]);
      }
    } catch (e) { console.error(e); }
  };

  const handleMarkAsRevised = async (id) => {
    const problem = problems.find(p => p.id === id);
    if (!problem) return;
    const newLvl = (problem.revisionLevel || 0) + 1;
    await handleUpdateProblem({ ...problem, revisionLevel: newLvl, nextRevisionDate: getNextRevisionDate(newLvl) });
  };

  const handleAddLink = async (name, url, logoSvg) => {
    try {
      const res = await fetch(LINKS_API_URL, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ name, url, logoSvg }) });
      if (res.ok) {
        const newL = await res.json();
        setLinks(l => [...l, newL]);
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteLink = async (id) => {
    if(!window.confirm("Delete this link?")) return;
    try {
      const res = await fetch(`${LINKS_API_URL}/${id}`, { method: 'DELETE', headers: getHeaders() });
      if (res.ok) setLinks(l => l.filter(x => x.id !== id));
    } catch (e) { console.error(e); }
  };

  // --- Edit State & Filter ---
  const handleStartEdit = (id) => setEditingProblemId(id);
  const handleCancelEdit = () => setEditingProblemId(null);
  const problemToEdit = problems.find(p => p.id === editingProblemId);
  
  const visibleProblems = (() => {
    let filtered = problems.filter(p => (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) || (p.source && p.source.toLowerCase().includes(searchTerm.toLowerCase())));
    if (filterSource !== "All") filtered = filtered.filter(p => p.source === filterSource);
    if (filterDifficulty !== "All") filtered = filtered.filter(p => p.difficulty === filterDifficulty);
    filtered.sort((a, b) => {
      const { key, direction } = sortConfig;
      let valA = a[key]; let valB = b[key];
      if (valA == null) valA = direction === 'asc' ? Infinity : -Infinity;
      if (valB == null) valB = direction === 'asc' ? Infinity : -Infinity;
      if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  })();

  // --- Main Render ---
  // NOTE: Removed blocking render. App renders immediately.
  
  return (
    <>
      <style>{`[data-animations="true"] * { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } [data-animations="true"] .anim-fade-in-up { animation: fadeIn 0.4s ease-out forwards; }`}</style>
      <div className="min-h-screen bg-gray-100 p-0 md:p-8 text-gray-900" style={{ backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none', backgroundSize: 'cover', backgroundAttachment: 'fixed' }}>
        <div className={`max-w-6xl mx-auto bg-transparent ${backgroundUrl ? 'bg-gray-100/50 backdrop-blur-sm p-4 rounded-lg' : ''}`}>
          <header className="p-3 mb-6 flex items-center justify-between">
            <span className="font-bold text-gray-900 text-2xl">{customHeading}</span>
            <div className="flex items-center gap-3">
               {user ? (
                 <>
                   <span className="text-sm font-medium text-gray-600">User: {user.username}</span>
                   <button onClick={handleLogout} className="text-xs text-red-600 hover:underline">Logout</button>
                 </>
               ) : (
                 <button onClick={handleLogin} className="text-sm font-bold text-blue-600 hover:underline">Login</button>
               )}
            </div>
          </header>

          <main className="bg-transparent px-4 md:px-0">
            <QuickLinksBar links={links} isLoading={isLoadingLinks} error={error} />
            {editingProblemId ? <ProblemForm problemToEdit={problemToEdit} onSubmit={handleUpdateProblem} onCancel={handleCancelEdit} /> : <ProblemForm onSubmit={handleAddProblem} />}
            <hr className="my-8 border-gray-300/50" />
            <RevisionList problems={problems} onMarkAsRevised={handleMarkAsRevised} />
            <hr className="my-8 border-gray-300/50" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Full Problem List</h2>
            <ExportImportControls problems={problems} onImportData={handleImportData} />
            <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            <FilterControls filterSource={filterSource} onFilterSourceChange={setFilterSource} filterDifficulty={filterDifficulty} onFilterDifficultyChange={setFilterDifficulty} sortConfig={sortConfig} onSortConfigChange={setSortConfig} />
            {isLoadingProblems && <div className="text-center text-gray-600 p-8">Loading...</div>}
            {!isLoadingProblems && <ProblemList problems={visibleProblems} onDeleteProblem={handleDeleteProblem} onStartEdit={handleStartEdit} />}
          </main>

          <footer className="text-center text-xs text-gray-500 mt-8 pb-8 flex justify-between items-center">
            <span>Powered by React & Spring Boot</span>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-black/10" title="Settings">
              <svg className="w-5 h-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.646.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 1.25c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.333.183-.582.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.646-.87-.074-.04-.147-.083-.22-.127a6.501 6.501 0 01-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.759 6.759 0 010-1.25c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.213-1.28z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
          </footer>
        </div>
      </div>
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} customHeading={customHeading} setCustomHeading={setCustomHeading} accentHue={accentHue} setAccentHue={setAccentHue} animationsOn={animationsOn} setAnimationsOn={setAnimationsOn} onBackgroundChange={handleBackgroundChange} onBackgroundClear={handleBackgroundClear} links={links} handleAddLink={handleAddLink} handleDeleteLink={handleDeleteLink} handleChangePassword={handleChangePassword} user={user} />
    </>
  );
}