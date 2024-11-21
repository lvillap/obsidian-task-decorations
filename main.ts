import { registerTaskLatencyLabels } from "features/latencyTimes/latency-times";
import { Plugin } from "obsidian";
import { registerAutomaticCreationDate } from "features/automatic-creation-date/automatic-creation-date";

export default class TaskLatencyPlugin extends Plugin {

	onload() {
		registerTaskLatencyLabels(this);
		registerAutomaticCreationDate(this);
	}
}
