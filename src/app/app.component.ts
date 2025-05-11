import { Component, effect, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatIcon, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { IdType, Network, Options } from 'vis-network';
import { DataSet } from 'vis-data';
import { CommonModule } from '@angular/common';
import { FullItem } from 'vis-data/declarations/data-interface';
import { MatFabButton } from '@angular/material/button';

interface Node {
	id: string;
	label: string;
	color?: string;
	type: string;
}

interface Edge {
	id?: string;  // Add id property to make it compatible with vis.js
	from: string;
	to: string;
	color?: string;
	label?: string;
	title?: string;
}

interface KGInstance {
	name: string,
	properties: KGInstanceProperty[]
}

interface KGInstanceProperty {
	name: string
	value: string
	dataType: string
}

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [ CommonModule, MatIcon, MatFabButton ],
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
	readonly networkContainer = viewChild<ElementRef<HTMLDivElement>>("networkContainer");
	private network!: Network;
	private nodes: DataSet<Node> = new DataSet<Node>();
	private edges: DataSet<Edge> = new DataSet<Edge>();
	readonly contextMenuCoordinates = signal<{ x: number; y: number } | null>(null);
	readonly contextMenuContent = signal<KGInstance | null>(null);
	readonly selectedNode = signal<Node | null>(null);
	readonly menuPosition = signal({ x: '0', y: '0' });
	readonly contextMenu = viewChild<ElementRef>("contextMenu");
	readonly referenceNodes = signal<string[]>([]);
	readonly primitiveTypes = [
		"xsd:string",
		"xsd:boolean",
		"xsd:decimal",
		"xsd:integer",
		"xsd:float",
		"xsd:double",
		"xsd:date",
		"xsd:dateTime",
	];

	constructor() {
		const iconRegistry = inject(MatIconRegistry);
		const sanitizer = inject(DomSanitizer);
		iconRegistry.addSvgIcon("convert-svg", sanitizer.bypassSecurityTrustResourceUrl("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXBpY2theGUtaWNvbiBsdWNpZGUtcGlja2F4ZSI+PHBhdGggZD0iTTE0LjUzMSAxMi40NjkgNi42MTkgMjAuMzhhMSAxIDAgMSAxLTMtM2w3LjkxMi03LjkxMiIvPjxwYXRoIGQ9Ik0xNS42ODYgNC4zMTRBMTIuNSAxMi41IDAgMCAwIDUuNDYxIDIuOTU4IDEgMSAwIDAgMCA1LjU4IDQuNzFhMjIgMjIgMCAwIDEgNi4zMTggMy4zOTMiLz48cGF0aCBkPSJNMTcuNyAzLjdhMSAxIDAgMCAwLTEuNCAwbC00LjYgNC42YTEgMSAwIDAgMCAwIDEuNGwyLjYgMi42YTEgMSAwIDAgMCAxLjQgMGw0LjYtNC42YTEgMSAwIDAgMCAwLTEuNHoiLz48cGF0aCBkPSJNMTkuNjg2IDguMzE0YTEyLjUwMSAxMi41MDEgMCAwIDEgMS4zNTYgMTAuMjI1IDEgMSAwIDAgMS0xLjc1MS0uMTE5IDIyIDIyIDAgMCAwLTMuMzkzLTYuMzE5Ii8+PC9zdmc+"));
		iconRegistry.addSvgIcon("string", sanitizer.bypassSecurityTrustResourceUrl("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWxldHRlci10ZXh0LWljb24gbHVjaWRlLWxldHRlci10ZXh0Ij48cGF0aCBkPSJNMTUgMTJoNiIvPjxwYXRoIGQ9Ik0xNSA2aDYiLz48cGF0aCBkPSJtMyAxMyAzLjU1My03LjcyNGEuNS41IDAgMCAxIC44OTQgMEwxMSAxMyIvPjxwYXRoIGQ9Ik0zIDE4aDE4Ii8+PHBhdGggZD0iTTMuOTIgMTFoNi4xNiIvPjwvc3ZnPg=="));
		iconRegistry.addSvgIcon("boolean-on", sanitizer.bypassSecurityTrustResourceUrl("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1NzYgNTEyIj48IS0tIUZvbnQgQXdlc29tZSBGcmVlIDYuNy4yIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlL2ZyZWUgQ29weXJpZ2h0IDIwMjUgRm9udGljb25zLCBJbmMuLS0+PHBhdGggZD0iTTE5MiA2NEM4NiA2NCAwIDE1MCAwIDI1NlM4NiA0NDggMTkyIDQ0OGwxOTIgMGMxMDYgMCAxOTItODYgMTkyLTE5MnMtODYtMTkyLTE5Mi0xOTJMMTkyIDY0em0xOTIgOTZhOTYgOTYgMCAxIDEgMCAxOTIgOTYgOTYgMCAxIDEgMC0xOTJ6Ii8+PC9zdmc+"));
		iconRegistry.addSvgIcon("boolean-off", sanitizer.bypassSecurityTrustResourceUrl("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1NzYgNTEyIj48IS0tIUZvbnQgQXdlc29tZSBGcmVlIDYuNy4yIGJ5IEBmb250YXdlc29tZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tIExpY2Vuc2UgLSBodHRwczovL2ZvbnRhd2Vzb21lLmNvbS9saWNlbnNlL2ZyZWUgQ29weXJpZ2h0IDIwMjUgRm9udGljb25zLCBJbmMuLS0+PHBhdGggZD0iTTM4NCAxMjhjNzAuNyAwIDEyOCA1Ny4zIDEyOCAxMjhzLTU3LjMgMTI4LTEyOCAxMjhsLTE5MiAwYy03MC43IDAtMTI4LTU3LjMtMTI4LTEyOHM1Ny4zLTEyOCAxMjgtMTI4bDE5MiAwek01NzYgMjU2YzAtMTA2LTg2LTE5Mi0xOTItMTkyTDE5MiA2NEM4NiA2NCAwIDE1MCAwIDI1NlM4NiA0NDggMTkyIDQ0OGwxOTIgMGMxMDYgMCAxOTItODYgMTkyLTE5MnpNMTkyIDM1MmE5NiA5NiAwIDEgMCAwLTE5MiA5NiA5NiAwIDEgMCAwIDE5MnoiLz48L3N2Zz4="));
		iconRegistry.addSvgIcon("decimal", sanitizer.bypassSecurityTrustResourceUrl("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWhhc2gtaWNvbiBsdWNpZGUtaGFzaCI+PGxpbmUgeDE9IjQiIHgyPSIyMCIgeTE9IjkiIHkyPSI5Ii8+PGxpbmUgeDE9IjQiIHgyPSIyMCIgeTE9IjE1IiB5Mj0iMTUiLz48bGluZSB4MT0iMTAiIHgyPSI4IiB5MT0iMyIgeTI9IjIxIi8+PGxpbmUgeDE9IjE2IiB4Mj0iMTQiIHkxPSIzIiB5Mj0iMjEiLz48L3N2Zz4="));
		iconRegistry.addSvgIcon("integer", sanitizer.bypassSecurityTrustResourceUrl("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWhhc2gtaWNvbiBsdWNpZGUtaGFzaCI+PGxpbmUgeDE9IjQiIHgyPSIyMCIgeTE9IjkiIHkyPSI5Ii8+PGxpbmUgeDE9IjQiIHgyPSIyMCIgeTE9IjE1IiB5Mj0iMTUiLz48bGluZSB4MT0iMTAiIHgyPSI4IiB5MT0iMyIgeTI9IjIxIi8+PGxpbmUgeDE9IjE2IiB4Mj0iMTQiIHkxPSIzIiB5Mj0iMjEiLz48L3N2Zz4="));
		iconRegistry.addSvgIcon("float", sanitizer.bypassSecurityTrustResourceUrl("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWRlY2ltYWxzLWFycm93LXJpZ2h0LWljb24gbHVjaWRlLWRlY2ltYWxzLWFycm93LXJpZ2h0Ij48cGF0aCBkPSJNMTAgMThoMTAiLz48cGF0aCBkPSJtMTcgMjEgMy0zLTMtMyIvPjxwYXRoIGQ9Ik0zIDExaC4wMSIvPjxyZWN0IHg9IjE1IiB5PSIzIiB3aWR0aD0iNSIgaGVpZ2h0PSI4IiByeD0iMi41Ii8+PHJlY3QgeD0iNiIgeT0iMyIgd2lkdGg9IjUiIGhlaWdodD0iOCIgcng9IjIuNSIvPjwvc3ZnPg=="));
		iconRegistry.addSvgIcon("double", sanitizer.bypassSecurityTrustResourceUrl("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWRlY2ltYWxzLWFycm93LXJpZ2h0LWljb24gbHVjaWRlLWRlY2ltYWxzLWFycm93LXJpZ2h0Ij48cGF0aCBkPSJNMTAgMThoMTAiLz48cGF0aCBkPSJtMTcgMjEgMy0zLTMtMyIvPjxwYXRoIGQ9Ik0zIDExaC4wMSIvPjxyZWN0IHg9IjE1IiB5PSIzIiB3aWR0aD0iNSIgaGVpZ2h0PSI4IiByeD0iMi41Ii8+PHJlY3QgeD0iNiIgeT0iMyIgd2lkdGg9IjUiIGhlaWdodD0iOCIgcng9IjIuNSIvPjwvc3ZnPg=="));
		iconRegistry.addSvgIcon("date", sanitizer.bypassSecurityTrustResourceUrl("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNhbGVuZGFyLWRheXMtaWNvbiBsdWNpZGUtY2FsZW5kYXItZGF5cyI+PHBhdGggZD0iTTggMnY0Ii8+PHBhdGggZD0iTTE2IDJ2NCIvPjxyZWN0IHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgeD0iMyIgeT0iNCIgcng9IjIiLz48cGF0aCBkPSJNMyAxMGgxOCIvPjxwYXRoIGQ9Ik04IDE0aC4wMSIvPjxwYXRoIGQ9Ik0xMiAxNGguMDEiLz48cGF0aCBkPSJNMTYgMTRoLjAxIi8+PHBhdGggZD0iTTggMThoLjAxIi8+PHBhdGggZD0iTTEyIDE4aC4wMSIvPjxwYXRoIGQ9Ik0xNiAxOGguMDEiLz48L3N2Zz4="));
		iconRegistry.addSvgIcon("dateTime", sanitizer.bypassSecurityTrustResourceUrl("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNhbGVuZGFyLWNsb2NrLWljb24gbHVjaWRlLWNhbGVuZGFyLWNsb2NrIj48cGF0aCBkPSJNMjEgNy41VjZhMiAyIDAgMCAwLTItMkg1YTIgMiAwIDAgMC0yIDJ2MTRhMiAyIDAgMCAwIDIgMmgzLjUiLz48cGF0aCBkPSJNMTYgMnY0Ii8+PHBhdGggZD0iTTggMnY0Ii8+PHBhdGggZD0iTTMgMTBoNSIvPjxwYXRoIGQ9Ik0xNy41IDE3LjUgMTYgMTYuM1YxNCIvPjxjaXJjbGUgY3g9IjE2IiBjeT0iMTYiIHI9IjYiLz48L3N2Zz4="));
		iconRegistry.addSvgIcon("reference", sanitizer.bypassSecurityTrustResourceUrl("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWxpbmsyLWljb24gbHVjaWRlLWxpbmstMiI+PHBhdGggZD0iTTkgMTdIN0E1IDUgMCAwIDEgNyA3aDIiLz48cGF0aCBkPSJNMTUgN2gyYTUgNSAwIDEgMSAwIDEwaC0yIi8+PGxpbmUgeDE9IjgiIHgyPSIxNiIgeTE9IjEyIiB5Mj0iMTIiLz48L3N2Zz4="));
		iconRegistry.addSvgIcon("edit-svg", sanitizer.bypassSecurityTrustResourceUrl("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXNxdWFyZS1wZW4taWNvbiBsdWNpZGUtc3F1YXJlLXBlbiI+PHBhdGggZD0iTTEyIDNINWEyIDIgMCAwIDAtMiAydjE0YTIgMiAwIDAgMCAyIDJoMTRhMiAyIDAgMCAwIDItMnYtNyIvPjxwYXRoIGQ9Ik0xOC4zNzUgMi42MjVhMSAxIDAgMCAxIDMgM2wtOS4wMTMgOS4wMTRhMiAyIDAgMCAxLS44NTMuNTA1bC0yLjg3My44NGEuNS41IDAgMCAxLS42Mi0uNjJsLjg0LTIuODczYTIgMiAwIDAgMSAuNTA2LS44NTJ6Ii8+PC9zdmc+"));
		effect(() => {
			const coordinates = this.contextMenuCoordinates();
			if ( coordinates && this.contextMenu() ) {
				const rect = this.contextMenu()!.nativeElement.getBoundingClientRect();
				const translateX = coordinates.x + rect.width > window.innerWidth ? '-100%' : '0';
				const translateY = coordinates.y + rect.height > window.innerHeight ? '-100%' : '0';
				this.menuPosition.set({ x: translateX, y: translateY });
			}
		});
	}

	ngOnInit(): void {
		this.initializeGraph();
	}

	getIcon(dataType: string, value?: string) {
		switch ( dataType ) {
			case "xsd:string":
				return "string";
			case "xsd:integer":
				return "integer";
			case "xsd:boolean":
				return value === "true" ? "boolean-on" : "boolean-off";
			case "xsd:decimal":
				return "decimal";
			case "xsd:float":
				return "float";
			case "xsd:double":
				return "double";
			case "xsd:date":
				return "date";
			case "xsd:dateTime":
				return "dateTime";
			default:
				return "reference";
		}
	}

	getOutlineColor(dataType: string) {
		switch ( dataType ) {
			case "xsd:string":
				return "outline-blue-200 text-blue-700 bg-blue-50";
			case "xsd:integer":
				return "outline-amber-200 text-amber-700 bg-amber-50";
			case "xsd:boolean":
				return "outline-purple-200 text-purple-700 bg-purple-50";
			case "xsd:decimal":
				return "outline-amber-200 text-amber-700 bg-amber-50";
			case "xsd:float":
				return "outline-cyan-200 text-cyan-700 bg-cyan-50";
			case "xsd:double":
				return "outline-cyan-200 text-cyan-700 bg-cyan-50";
			case "xsd:date":
				return "outline-teal-200 text-teal-700 bg-teal-50";
			case "xsd:dateTime":
				return "outline-teal-200 text-teal-700 bg-teal-50";
			default:
				return "outline-pink-200 text-pink-700 bg-pink-50";
		}
	}

	getValueColour(dataType: string) {
		switch ( dataType ) {
			case "xsd:string":
			case "xsd:date":
			case "xsd:dateTime":
				return "text-[#69a460]";
			case "xsd:integer":
			case "xsd:decimal":
			case "xsd:float":
			case "xsd:double":
				return "text-[#27616e]";
			case "xsd:boolean":
				return "text-[#a95736]";
			default:
				return "text-gray-700";
		}
	}

	isLiteral(dataType: string) {
		return dataType.startsWith("xsd:");
	}

	private initializeGraph(): void {
		const graph = {
			'node': [ {
				'id': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuredPerson1',
				'label': 'InsuredPerson1',
				'title': 'InsuredPerson1',
				'type': 'InsuredPerson'
			}, {
				'id': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuredPerson1/NamedInsured',
				'label': 'GANESHKUMARPANDIAN',
				'title': 'GANESHKUMARPANDIAN',
				'type': 'xsd:string'
			}, {
				'id': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuranceAgent1',
				'label': 'InsuranceAgent1',
				'title': 'InsuranceAgent1',
				'type': 'InsuranceAgent'
			}, {
				'id': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuranceAgent1/AgentPhone',
				'label': '(215)513-0600',
				'title': '(215)513-0600',
				'type': 'xsd:string'
			}, {
				'id': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsurancePolicy1',
				'label': 'InsurancePolicy1',
				'title': 'InsurancePolicy1',
				'type': 'InsurancePolicy'
			}, {
				'id': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsurancePolicy1/PolicyNumber',
				'label': 'Q081710114',
				'title': 'Q081710114',
				'type': 'xsd:string'
			}, {
				'id': 'https://insgenai.ltimindtree.com/GaneshPolicy/Vehicle1',
				'label': 'Vehicle1',
				'title': 'Vehicle1',
				'type': 'Vehicle'
			}, {
				'id': 'https://insgenai.ltimindtree.com/GaneshPolicy/Vehicle1/AnnualMiles',
				'label': '8,501orgreater',
				'title': '8,501orgreater',
				'type': 'xsd:string'
			}, {
				'id': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsurancePolicy1/PolicyPeriod',
				'label': '08/17/2021to08/17/2022',
				'title': '08/17/2021to08/17/2022',
				'type': 'xsd:string'
			}, {
				'id': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsurancePolicy',
				'label': 'InsurancePolicy',
				'title': 'InsurancePolicy',
				'type': 'Resource'
			}, {
				'id': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsurancePolicy1/policyVersion',
				'label': '1',
				'title': '1',
				'type': 'xsd:integer'
			}, {
				'id': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsurancePolicy1/isActive',
				'label': 'true',
				'title': 'true',
				'type': 'xsd:boolean'
			}, {
				'id': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuredPerson1/label',
				'label': 'Ganesh Kumar Pandian',
				'title': 'Ganesh Kumar Pandian',
				'type': 'xsd:string'
			}, {
				'id': 'https://insgenai.ltimindtree.com/GaneshPolicy/Vehicle1/StateUse',
				'label': 'PA',
				'title': 'PA',
				'type': 'xsd:string'
			}, {
				'id': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuredPerson',
				'label': 'InsuredPerson',
				'title': 'InsuredPerson',
				'type': 'Resource'
			}, {
				'id': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsurancePolicy1/TotalAnnualPolicyPremium',
				'label': '$644.00',
				'title': '$644.00',
				'type': 'xsd:string'
			}, {
				'id': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuranceAgent',
				'label': 'InsuranceAgent',
				'title': 'InsuranceAgent',
				'type': 'Resource'
			}, {
				'id': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuranceAgent1/AgentName',
				'label': 'FINNEYINSURANCEAGENCYINC',
				'title': 'FINNEYINSURANCEAGENCYINC',
				'type': 'xsd:string'
			}, {
				'id': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuredPerson1/Status',
				'label': 'Married',
				'title': 'Married',
				'type': 'xsd:string'
			}, {
				'id': 'https://insgenai.ltimindtree.com/GaneshPolicy/Vehicle',
				'label': 'Vehicle',
				'title': 'Vehicle',
				'type': 'Resource'
			}, {
				'id': 'https://insgenai.ltimindtree.com/GaneshPolicy/Vehicle1/VehicleVIN',
				'label': '1HGCP26839A120000',
				'title': '1HGCP26839A120000',
				'type': 'xsd:string'
			} ],
			'edge': [ {
				'id': '_InsuredPerson1#NamedInsured',
				'from': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuredPerson1',
				'to': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuredPerson1/NamedInsured',
				'label': 'NamedInsured',
				'title': 'NamedInsured'
			}, {
				'id': '_InsuranceAgent1#AgentPhone',
				'from': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuranceAgent1',
				'to': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuranceAgent1/AgentPhone',
				'label': 'AgentPhone',
				'title': 'AgentPhone'
			}, {
				'id': '_InsurancePolicy1#PolicyNumber',
				'from': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsurancePolicy1',
				'to': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsurancePolicy1/PolicyNumber',
				'label': 'PolicyNumber',
				'title': 'PolicyNumber'
			}, {
				'id': '_InsurancePolicy1#isHeldBy1',
				'from': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsurancePolicy1',
				'to': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuredPerson1',
				'label': 'isHeldBy',
				'title': 'isHeldBy'
			}, {
				'id': '_Vehicle1#AnnualMiles',
				'from': 'https://insgenai.ltimindtree.com/GaneshPolicy/Vehicle1',
				'to': 'https://insgenai.ltimindtree.com/GaneshPolicy/Vehicle1/AnnualMiles',
				'label': 'AnnualMiles',
				'title': 'AnnualMiles'
			}, {
				'id': '_InsurancePolicy1#PolicyPeriod',
				'from': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsurancePolicy1',
				'to': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsurancePolicy1/PolicyPeriod',
				'label': 'PolicyPeriod',
				'title': 'PolicyPeriod'
			}, {
				'id': '_InsurancePolicy1#InsurancePolicy',
				'from': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsurancePolicy1',
				'to': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsurancePolicy',
				'label': '#type',
				'title': '#type'
			}, {
				'id': '_InsurancePolicy1#policyVersion',
				'from': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsurancePolicy1',
				'to': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsurancePolicy1/policyVersion',
				'label': 'policyVersion',
				'title': 'policyVersion'
			}, {
				'id': '_InsurancePolicy1#covers1',
				'from': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsurancePolicy1',
				'to': 'https://insgenai.ltimindtree.com/GaneshPolicy/Vehicle1',
				'label': 'covers',
				'title': 'covers'
			}, {
				'id': '_InsurancePolicy1#isActive',
				'from': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsurancePolicy1',
				'to': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsurancePolicy1/isActive',
				'label': 'isActive',
				'title': 'isActive'
			}, {
				'id': '_InsuredPerson1#label',
				'from': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuredPerson1',
				'to': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuredPerson1/label',
				'label': 'label',
				'title': 'label'
			}, {
				'id': '_Vehicle1#StateUse',
				'from': 'https://insgenai.ltimindtree.com/GaneshPolicy/Vehicle1',
				'to': 'https://insgenai.ltimindtree.com/GaneshPolicy/Vehicle1/StateUse',
				'label': 'StateUse',
				'title': 'StateUse'
			}, {
				'id': '_InsuredPerson1#InsuredPerson',
				'from': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuredPerson1',
				'to': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuredPerson',
				'label': '#type',
				'title': '#type'
			}, {
				'id': '_InsurancePolicy1#TotalAnnualPolicyPremium',
				'from': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsurancePolicy1',
				'to': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsurancePolicy1/TotalAnnualPolicyPremium',
				'label': 'TotalAnnualPolicyPremium',
				'title': 'TotalAnnualPolicyPremium'
			}, {
				'id': '_InsurancePolicy1#isManagedBy1',
				'from': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsurancePolicy1',
				'to': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuranceAgent1',
				'label': 'isManagedBy',
				'title': 'isManagedBy'
			}, {
				'id': '_InsuranceAgent1#InsuranceAgent',
				'from': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuranceAgent1',
				'to': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuranceAgent',
				'label': '#type',
				'title': '#type'
			}, {
				'id': '_InsuranceAgent1#AgentName',
				'from': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuranceAgent1',
				'to': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuranceAgent1/AgentName',
				'label': 'AgentName',
				'title': 'AgentName'
			}, {
				'id': '_InsuredPerson1#Status',
				'from': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuredPerson1',
				'to': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuredPerson1/Status',
				'label': 'Status',
				'title': 'Status'
			}, {
				'id': '_Vehicle1#Vehicle',
				'from': 'https://insgenai.ltimindtree.com/GaneshPolicy/Vehicle1',
				'to': 'https://insgenai.ltimindtree.com/GaneshPolicy/Vehicle',
				'label': '#type',
				'title': '#type'
			}, {
				'id': '_Vehicle1#VehicleVIN',
				'from': 'https://insgenai.ltimindtree.com/GaneshPolicy/Vehicle1',
				'to': 'https://insgenai.ltimindtree.com/GaneshPolicy/Vehicle1/VehicleVIN',
				'label': 'VehicleVIN',
				'title': 'VehicleVIN'
			}, {
				'id': '_InsuredPerson1#IsMariedTo1',
				'from': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuredPerson1',
				'to': 'https://insgenai.ltimindtree.com/GaneshPolicy/InsuredPerson1',
				'label': 'IsMariedTo',
				'title': 'IsMariedTo'
			} ]
		};
		this.nodes.add(graph.node);
		this.edges.add(graph.edge);
		this.referenceNodes.set(this.edges
			.stream()
			.filter(edge => edge.label === "#type")
			.map(edge => this.nodes.get(edge.to)?.label)
			.filter(nodeLabel => nodeLabel != undefined)
			.toItemArray() as string[]);

		// Create the network
		const container = this.networkContainer()?.nativeElement;
		if ( !container ) {
			return;
		}
		const data = { nodes: this.nodes, edges: this.edges };
		const options: Options = {
			autoResize: true,
			width: '100%',
			height: '100%',
			layout: {
				randomSeed: 12345,
				improvedLayout: true,
			},
			nodes: {
				shape: 'dot',
				size: 20,
				font: {
					size: 12,
					color: 'black'
				},
				borderWidth: 1,
				shadow: true,
				color: {
					background: "#65b741",
					highlight: {
						background: "#65b741",
						border: "red",
					},
					hover: {
						background: "#fff",
						border: "red",
					}
				}
			},
			edges: {
				width: 1,
				arrows: "to",
				font: { align: "top" },
				color: {
					color: "#65b741",
					highlight: "red",
					hover: "red",
				}
			},
			interaction: {
				navigationButtons: true,
				keyboard: true,
				hover: true,
				zoomView: true,
				dragView: true,
			},
			physics: {
				forceAtlas2Based: {
					gravitationalConstant: -26,
					centralGravity: 0.005,
					springLength: 250,
					springConstant: 0.18,
					damping: 0.4,
					avoidOverlap: 0.1
				},
				maxVelocity: 120,
				solver: 'forceAtlas2Based',
				timestep: 0.35,
				stabilization: { enabled: true, iterations: 2000, updateInterval: 50 }
			}
		};

		this.network = new Network(container, data, options);

		this.network.on("doubleClick", (params) => {
			const nodeId: IdType = params.nodes[0];
			const edges: FullItem<Edge, "id">[] = params.edges.map((edgeId: string) => this.edges.get(edgeId));
			if ( nodeId ) {
				const node = this.nodes.get(nodeId);
				if ( node && node.type !== "Resource" ) {
					this.contextMenuCoordinates.set(params.pointer.DOM);
					this.selectedNode.set(node);

					if ( this.isLiteral(node.type) ) {
						this.contextMenuContent.set({
							name: node.type,
							properties: [],
						});
						return;
					}
					this.contextMenuContent.set(edges.reduce((acc: KGInstance, edge) => {
						if ( edge.from !== nodeId ) {
							return acc;
						}
						const toNode = this.nodes.get(edge.to);
						if ( !toNode ) {
							return acc;
						}
						if ( edge.label === "#type" ) {
							acc.name = toNode.label;
							return acc;
						}
						acc.properties.push({
							name: edge.label!,
							value: toNode.label,
							dataType: toNode.type,
						});
						return acc;
					}, { name: "", properties: [] }));
				}
			}
		})
	}

	convertGraphToTTL() {
		const ttlBuilder = new TTLBuilder();
		this.edges
			.stream()
			.filter(edge => edge.label === "#type")
			.forEach(({ to, from, id }) => {
				const toNode = this.nodes.get(to);
				const fromNode = this.nodes.get(from);
				if ( !toNode || !fromNode ) {
					return false;
				}
				if ( !ttlBuilder.isPrefixSet() ) {
					ttlBuilder.setPrefix(fromNode.id);
				}
				let connectedNodes = this.network.getConnectedEdges(fromNode.id)
					.map($id => this.edges.get($id))
					.filter(edge => edge?.id !== id && edge?.from === fromNode.id)
					.map(edge => ( {
						propertyName: edge?.label,
						connectedNode: this.nodes.get(edge?.to as IdType)
					} ));
				ttlBuilder.addInstance(fromNode.label, toNode.label, connectedNodes);
				return true;
			});
		console.log(ttlBuilder.toString());
	}
}

class TTLBuilder {
	private prefix: string | null = null;
	private namespace: string | null = null;
	private instances: string[] = [];

	isPrefixSet() {
		return this.prefix !== null;
	}

	setPrefix(uri: string) {
		uri = uri.substring(0, uri.lastIndexOf("/"));
		const namespace = uri.split("/").pop() ?? "";
		this.namespace = namespace;
		this.prefix = `@prefix ${ namespace }: <${ uri }/> .`;
	}

	addInstance(fromNodeLabel: string, resourceType: string, connectedNodes: {
		propertyName: string | undefined
		connectedNode: FullItem<Node, "id"> | null
	}[]) {
		const indent = "\t";
		let instanceStr = `${ this.namespace }:${ fromNodeLabel } a ${ this.namespace }:${ resourceType } ;\n`;
		for ( let i = 0; i < connectedNodes.length; i++ ) {
			const node = connectedNodes[i];
			const propertyName = `${ this.namespace }:${ node.propertyName ?? "unknown" }`;
			const isLiteral = [ "xsd:string", "xsd:integer", "xsd:boolean", "xsd:decimal", "xsd:float", "xsd:double", "xsd:dateTime", "xsd:time", "xsd:date", "xsd:gYear", "xsd:gMonthDay", "xsd:anyURI", "xsd:langString" ].includes(node.connectedNode?.type ?? "");
			const value = isLiteral ? `"${ node.connectedNode?.label ?? "" }"^^${ node.connectedNode?.type }` : `${ this.namespace }:${ node.connectedNode?.label }`;
			instanceStr = instanceStr.concat(`${ indent }${ propertyName } ${ value } ${ i === connectedNodes.length - 1 ? '.' : ';' }\n`);
		}
		this.instances.push(instanceStr);
	}

	toString() {
		return `${ this.prefix ?? '\n' }
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix ex: <http://example.org/> .

${ this.instances.join("\n\n") }`;
	}
}
