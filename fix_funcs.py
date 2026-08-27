with open("apps/web/components/canvas/architecture-canvas.tsx", "r", encoding="utf-8") as f:
    content = f.read()

funcs_find = """    const handleExportPNG = async () => {"""
funcs_replace = """    const downloadNotesTxt = useCallback(() => {
        const blob = new Blob([projectNotes], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'project-notes.txt';
        a.click();
        URL.revokeObjectURL(url);
    }, [projectNotes]);

    const downloadNotesJson = useCallback(() => {
        const blob = new Blob([JSON.stringify({ notes: projectNotes }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'project-notes.json';
        a.click();
        URL.revokeObjectURL(url);
    }, [projectNotes]);

    const handleExportPNG = async () => {"""
content = content.replace(funcs_find, funcs_replace)

with open("apps/web/components/canvas/architecture-canvas.tsx", "w", encoding="utf-8") as f:
    f.write(content)
