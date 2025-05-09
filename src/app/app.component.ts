import { Component, effect, ElementRef, OnInit, signal, viewChild } from '@angular/core';
import { IdType, Network, Options } from 'vis-network';
import { DataSet } from 'vis-data';
import { CommonModule } from '@angular/common';
import { FullItem } from 'vis-data/declarations/data-interface';

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
	imports: [ CommonModule ],
	templateUrl: './app.component.html',
	styleUrl: './app.component.css'
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

	constructor() {
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
					console.log('Selected node:', this.selectedNode());
					console.log({ edges });
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

	protected readonly window = window;
}
