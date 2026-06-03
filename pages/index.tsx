import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://15.206.125.175:3000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';
const authHeaders = { 'Content-Type': 'application/json', 'x-api-key': API_KEY };

interface Category { id: number; name: string; slug: string; level: string; }
interface Block { category_id: number; category_slug: string; name: string; level: string; updated_at: string; }

export default function AdminPLP() {
  const [l0List, setL0List] = useState<Category[]>([]);
  const [l1List, setL1List] = useState<Category[]>([]);
  const [l2List, setL2List] = useState<Category[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [preview, setPreview] = useState('');
  const [mode, setMode] = useState<'new' | 'exists'>('new');
  const [lastSaved, setLastSaved] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [toast, setToast] = useState({ msg: '', type: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadL0(); loadBlocks(); }, []);

  useEffect(() => {
    if (!markdown.trim()) { setPreview(''); return; }
    import('marked').then(({ marked }) => setPreview(marked.parse(markdown) as string));
  }, [markdown]);

  function showToast(msg: string, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3000);
  }

  async function loadL0() {
    const res = await fetch(`${API}/api/categories/l0`);
    const data = await res.json();
    setL0List(data.categories || []);
  }

  async function loadBlocks() {
    const res = await fetch(`${API}/api/plp`);
    const data = await res.json();
    setBlocks(data.blocks || []);
  }

  async function onL0Change(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = parseInt(e.target.value);
    const name = e.target.options[e.target.selectedIndex].text;
    setL1List([]); setL2List([]); resetEditor();
    if (!id) return;
    const cat = l0List.find(c => c.id === id);
    await selectCategory(id, cat?.slug || '', 'L0', name);
    const res = await fetch(`${API}/api/categories/${id}/children`);
    const data = await res.json();
    setL1List(data.categories || []);
  }

  async function onL1Change(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = parseInt(e.target.value);
    const opt = e.target.options[e.target.selectedIndex];
    setL2List([]); resetEditor();
    if (!id) return;
    await selectCategory(id, opt.dataset.slug || '', 'L1', opt.text);
    const res = await fetch(`${API}/api/categories/${id}/children`);
    const data = await res.json();
    setL2List(data.categories || []);
  }

  async function onL2Change(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = parseInt(e.target.value);
    const opt = e.target.options[e.target.selectedIndex];
    resetEditor();
    if (!id) return;
    await selectCategory(id, opt.dataset.slug || '', 'L2', opt.text);
  }

  async function selectCategory(id: number, slug: string, level: string, name: string) {
    setSelectedId(id); setSelectedSlug(slug); setSelectedLevel(level); setSelectedName(name);
    const res = await fetch(`${API}/api/plp/${id}`);
    if (res.ok) {
      const data = await res.json();
      setMode('exists'); setMarkdown(data.markdown);
      setLastSaved(`Last saved: ${new Date(data.updated_at).toLocaleString()}`);
    } else {
      setMode('new'); setMarkdown(''); setLastSaved('');
    }
  }

  function resetEditor() {
    setSelectedId(null); setSelectedSlug(''); setSelectedName('');
    setSelectedLevel(''); setMarkdown(''); setPreview(''); setLastSaved(''); setMode('new');
  }

  async function saveContent() {
    if (!selectedId || !markdown.trim()) { showToast('Content cannot be empty', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/plp/${selectedId}`, {
        method: mode === 'exists' ? 'PATCH' : 'POST',
        headers: authHeaders,
        body: JSON.stringify({ markdown_content: markdown }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setMode('exists');
      setLastSaved(`Last saved: ${new Date().toLocaleString()}`);
      showToast('Saved successfully!');
      loadBlocks();
    } catch (err: any) {
      showToast('Save failed: ' + err.message, 'error');
    } finally { setSaving(false); }
  }

  async function deleteBlock() {
    if (!selectedId || !confirm(`Delete SEO block for "${selectedSlug}"?`)) return;
    const res = await fetch(`${API}/api/plp/${selectedId}`, { method: 'DELETE', headers: authHeaders });
    const data = await res.json();
    if (!data.ok) { showToast('Delete failed: ' + data.error, 'error'); return; }
    resetEditor(); showToast('Deleted'); loadBlocks();
  }

  const lvlBg: Record<string, string> = { L0: '#fef3c7', L1: '#dbeafe', L2: '#dcfce7' };
  const lvlColor: Record<string, string> = { L0: '#d97706', L1: '#1d4ed8', L2: '#16a34a' };

  return (
    <div style={{ fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif', background: '#f4f6f9', minHeight: '100vh' }}>
      <style>{`
        a { color: #4f46e5; text-decoration: underline; }
        h1,h2,h3 { margin: 16px 0 8px; color: #1a1a2e; }
        h1 { font-size: 22px; } h2 { font-size: 18px; } h3 { font-size: 16px; }
        p { margin-bottom: 12px; }
        ul,ol { padding-left: 24px; margin-bottom: 12px; }
        li { margin-bottom: 4px; }
        strong { font-weight: 700; }
        blockquote { border-left: 3px solid #4f46e5; padding-left: 16px; color: #666; margin: 12px 0; }
        hr { border: none; border-top: 1px solid #eee; margin: 16px 0; }
      `}</style>

      {/* Header */}
      <div style={{ background: '#1a1a2e', color: '#fff', padding: '16px 32px' }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>PLP SEO Content Manager</div>
        <div style={{ fontSize: 13, opacity: 0.6 }}>Category-wise markdown blocks</div>
      </div>

      <div style={{ maxWidth: 1300, margin: '28px auto', padding: '0 24px' }}>

        {/* Category Selector */}
        <div style={{ background: '#fff', borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Select Category</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={labelStyle}>L0 — Main Category</div>
              <select onChange={onL0Change} style={selectStyle}>
                <option value="">— Select —</option>
                {l0List.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={labelStyle}>L1 — Sub Category</div>
              <select disabled={!l1List.length} onChange={onL1Change} style={{ ...selectStyle, opacity: l1List.length ? 1 : 0.5 }}>
                <option value="">— Select L0 first —</option>
                {l1List.map(c => <option key={c.id} value={c.id} data-slug={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={labelStyle}>L2 — Child Category</div>
              <select disabled={!l2List.length} onChange={onL2Change} style={{ ...selectStyle, opacity: l2List.length ? 1 : 0.5 }}>
                <option value="">— None —</option>
                {l2List.map(c => <option key={c.id} value={c.id} data-slug={c.slug}>{c.name}</option>)}
              </select>
            </div>
          </div>
          {selectedId && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: '#f0f0fd', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, flexWrap: 'wrap' }}>
              <strong>{selectedName}</strong>
              <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: lvlBg[selectedLevel], color: lvlColor[selectedLevel] }}>{selectedLevel}</span>
              <span style={{ fontFamily: 'monospace', background: '#e0e0fa', color: '#4f46e5', padding: '2px 10px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>{selectedSlug}</span>
              <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: mode === 'exists' ? '#dcfce7' : '#fef9c3', color: mode === 'exists' ? '#16a34a' : '#ca8a04' }}>
                {mode === 'exists' ? 'Has SEO' : 'No SEO yet'}
              </span>
            </div>
          )}
        </div>

        {/* Editor + Preview */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>
              <span style={panelTitleStyle}>Markdown Editor</span>
              <span style={{ fontSize: 12, color: '#aaa' }}>{selectedName || 'Select a category above'}</span>
            </div>
            <textarea disabled={!selectedId} value={markdown} onChange={e => setMarkdown(e.target.value)}
              placeholder="Select a category above to start editing..."
              style={{ flex: 1, minHeight: 420, padding: 20, border: 'none', resize: 'none', fontFamily: 'Courier New,monospace', fontSize: 14, lineHeight: 1.7, outline: 'none', background: '#fafafa', opacity: selectedId ? 1 : 0.5, width: '100%' }} />
          </div>
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>
              <span style={panelTitleStyle}>Live Preview</span>
              <span style={{ fontSize: 12, color: '#aaa' }}>As it will appear on site</span>
            </div>
            <div style={{ flex: 1, padding: '20px 24px', minHeight: 420, overflowY: 'auto', lineHeight: 1.75, fontSize: 15, color: '#2d2d2d' }}
              dangerouslySetInnerHTML={{ __html: preview || '<p style="color:#bbb;font-style:italic;text-align:center;margin-top:60px">Select a category and start writing to see a preview.</p>' }} />
          </div>
        </div>

        {/* Action bar */}
        <div style={{ background: '#fff', borderRadius: 10, padding: '14px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button disabled={!selectedId || saving} onClick={saveContent}
              style={{ ...btnBase, background: '#4f46e5', color: '#fff', opacity: (!selectedId || saving) ? 0.4 : 1 }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            {mode === 'exists' && (
              <button onClick={deleteBlock} style={{ ...btnBase, background: '#fee2e2', color: '#dc2626' }}>Delete</button>
            )}
          </div>
          <div style={{ fontSize: 13, color: '#aaa' }}>{lastSaved}</div>
        </div>

        {/* All blocks */}
        <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden', marginTop: 24, marginBottom: 40 }}>
          <div style={{ padding: '13px 20px', borderBottom: '1px solid #f0f0f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={panelTitleStyle}>All SEO Blocks</span>
            <span style={{ fontSize: 12, color: '#aaa' }}>{blocks.length} block{blocks.length !== 1 ? 's' : ''}</span>
          </div>
          {blocks.length === 0
            ? <div style={{ padding: 32, textAlign: 'center', color: '#bbb', fontSize: 14 }}>No SEO blocks added yet.</div>
            : blocks.map(b => (
              <div key={b.category_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 20px', borderBottom: '1px solid #f7f7fa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: lvlBg[b.level], color: lvlColor[b.level] }}>{b.level}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{b.name}</div>
                    <div style={{ fontSize: 12, color: '#aaa', fontFamily: 'monospace' }}>{b.category_slug}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#bbb' }}>{new Date(b.updated_at).toLocaleDateString()}</div>
              </div>
            ))}
        </div>
      </div>

      {/* Toast */}
      {toast.msg && (
        <div style={{ position: 'fixed', bottom: 28, right: 28, padding: '12px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', background: toast.type === 'error' ? '#dc2626' : '#16a34a', zIndex: 999 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 };
const selectStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1.5px solid #dde1e9', borderRadius: 7, fontSize: 14, background: '#fff', outline: 'none', cursor: 'pointer' };
const panelStyle: React.CSSProperties = { background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column' };
const panelHeaderStyle: React.CSSProperties = { padding: '13px 20px', borderBottom: '1px solid #f0f0f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const panelTitleStyle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' };
const btnBase: React.CSSProperties = { padding: '9px 20px', borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none' };
