import TaskLatencyPlugin from "main";
import { Decoration, DecorationSet, EditorView, ViewPlugin, Range, ViewUpdate, WidgetType } from '@codemirror/view';

export function registerTaskLatencyLabels(plugin: TaskLatencyPlugin) {

	const taskDecorator = ViewPlugin.fromClass(
		class {
			decorations: any;

			constructor(view: EditorView) {
				this.decorations = this.decorateTasks(view);
			}

			update(update: ViewUpdate) {
				if (update.docChanged || update.viewportChanged) {
					this.decorations = this.decorateTasks(update.view);
				}
			}

			decorateTasks(view: EditorView): DecorationSet {

				const widgets: Range<Decoration>[] = [];

				for (const { from, to } of view.visibleRanges) {

					const text = view.state.doc.sliceString(from, to);
					const lines = text.split("\n");

					let offset = from;
					lines.forEach((line) => {

						if (
							isTaskWithDate(line)
						) {

							const latencyText = createLatencyTextFor(line);

							const deco = Decoration.widget({
								widget: new class extends WidgetType {
									toDOM() {

										let urgency = "low-urgency";
										if (latencyText.indexOf("month") !== -1) {
											urgency = "huge-urgency";
										} else if (latencyText.indexOf("weeks") !== -1) {
											urgency = "big-urgency";
										} else if (latencyText.indexOf("week") !== -1) {
											urgency = "medium-urgency";
										}

										const span = document.createElement("span");
										span.classList.add("latency-time");
										span.classList.add(urgency);
										span.textContent = ` ${latencyText}`;
										return span;
									}

									updateDOM(prev: HTMLElement) {
										prev.textContent = ` ${latencyText}`;
										return true;
									}
								}(),
								side: 1,
							});

							if (offset + line.length <= view.state.doc.length) {
								widgets.push(deco.range(offset + line.length));
							}
						}
						offset += line.length + 1;
					});
				}
				return Decoration.set(widgets, true); // Forzar consistencia en las decoraciones
			}
		},
		{
			decorations: (v) => v.decorations,
		}
	);

	plugin.registerEditorExtension(taskDecorator);
}


export function isTaskWithDate(line: string): RegExpMatchArray | null {
	return line.match(/- \[[ x]\] .+ ➕\s*\d{4}-\d{2}-\d{2}.*(✅\s*\d{4}-\d{2}-\d{2})?/);
}

export function createLatencyTextFor(line: string): string {

	const createdMatch = line.match(/➕\s*(\d{4}-\d{2}-\d{2})/);
	const closedMatch = line.match(/✅\s*(\d{4}-\d{2}-\d{2})/);

	const createdDate = createdMatch ? new Date(createdMatch[1]) : null;
	const closedDate = closedMatch ? new Date(closedMatch[1]) : null;

	let latencyText = "";

	if (createdDate) {
		const today = new Date();

		if (closedDate) {
			let daysToClose = getDatesDifferenceText(createdDate, closedDate);
			if (daysToClose === "today") {
				daysToClose = "the same day";
			} else {
				daysToClose = `in ${daysToClose}`;
			}
			latencyText = `(done ${daysToClose})`.replace(" ago", "");
		} else {
			let daysSinceCreated = getDatesDifferenceText(createdDate, today);
			if (daysSinceCreated === "1 day ago") {
				daysSinceCreated = "yesterday";
			}
			latencyText = `(created ${daysSinceCreated})`;
		}
	}

	return latencyText;
}

function getDatesDifferenceText(fechaInicio: Date, fechaFin: Date): string {

    const diferencia = fechaFin.getTime() - fechaInicio.getTime(); // Diferencia en milisegundos
    const milisegundosPorDia = 24 * 60 * 60 * 1000;
    const milisegundosPorSemana = 7 * milisegundosPorDia;
    const milisegundosPorMes = 30 * milisegundosPorDia; // Aproximación de 30 días por mes

    const dias = Math.floor(diferencia / milisegundosPorDia);

	if (diferencia < milisegundosPorDia) {
		return "today";
	} else if (diferencia < milisegundosPorSemana) {
        return `${dias} day${dias !== 1 ? 's' : ''} ago`;
    } else if (diferencia < milisegundosPorMes * 4) {
        // Si la diferencia es menos de 4 semanas, mostramos semanas y días
        const semanas = Math.floor(dias / 7);
        const diasRestantes = dias % 7;
		const parteDias = diasRestantes === 0 ? '' : ` ${diasRestantes} day${diasRestantes !== 1 ? 's' : ''}`;
        return `${semanas} week${semanas !== 1 ? 's' : ''}${parteDias} ago`;
    } else {
        // Si la diferencia es más de 4 semanas, mostramos meses y días
        const meses = Math.floor(dias / 30);
        const diasRestantes = dias % 30;
        return `${meses} month${meses !== 1 ? 's' : ''} ${diasRestantes} day${diasRestantes !== 1 ? 's' : ''} ago`;
    }
}
