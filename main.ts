import { Plugin } from "obsidian";
import { EditorView, Decoration, ViewPlugin, ViewUpdate, WidgetType, Range, DecorationSet } from "@codemirror/view";
import { createLatencyTextFor, isTaskWithDate } from "features/latencyTimes/latency-times";
import { registerAutomaticCreationDate } from "features/automatic-creation-date/automatic-creation-date";

export default class TaskLatencyPlugin extends Plugin {

	onload() {

		registerAutomaticCreationDate(this);

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
											const span = document.createElement("span");
											span.className = "latency-time";
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

		this.registerEditorExtension(taskDecorator);
	}
}
