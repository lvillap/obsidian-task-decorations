import TaskLatencyPlugin from "main";

export function registerAutomaticCreationDate(plugin: TaskLatencyPlugin) {
	// Registramos el evento para escuchar cuando el contenido del editor cambie
	plugin.registerEvent(
		plugin.app.workspace.on('editor-change', (editor) => {
			handleEditorChange(editor);
		})
	);
}


// Función que se ejecuta cada vez que cambia el editor
function handleEditorChange(editor: any) {

	const cursor = editor.getCursor(); // Obtener la posición actual del cursor
	const line = editor.getLine(cursor.line); // Obtener el contenido de la línea actual

	// Si la línea es una tarea y no tiene fecha, agregamos la fecha
	if (isTask(line) && !hasDate(line)) {
		const newLine = `${line} ➕${getCurrentDate()}`;
		editor.replaceRange(newLine, { line: cursor.line, ch: 0 }, { line: cursor.line });
		editor.setCursor(cursor);
	}
}

// Función para verificar si la línea es una tarea (por ejemplo, que empiece con '- [ ]' o '- [x]')
function isTask(line: string): boolean {
	return line.trim().startsWith("- [ ]") || line.trim().startsWith("- [x]");
}

// Comprobar si ya contiene una fecha
function hasDate(line: string): boolean {
	return line.indexOf("➕") !== -1;
}

// Función para obtener la fecha actual en el formato deseado (YYYY-MM-DD)
function getCurrentDate(): string {
	const date = new Date();
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0'); // Asegura el formato de dos dígitos
	const day = String(date.getDate()).padStart(2, '0'); // Asegura el formato de dos dígitos
	return `${year}-${month}-${day}`;
}
