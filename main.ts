import { registerTaskLatencyLabels } from "features/latencyTimes/latency-times";
import { Plugin } from "obsidian";

export default class TaskLatencyPlugin extends Plugin {

	onload() {

		registerTaskLatencyLabels(this);

	}
}
