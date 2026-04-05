import GenerationService, { type GenerationCallbacks, type GenerationConfig, type GenerationResult } from '../service/GenerationService.ts';

class GenerationController {
	private service: GenerationService;

	constructor(boardSize: number = 8) {
		this.service = new GenerationService(boardSize);
	}

	async run(config: Partial<GenerationConfig>, callbacks: GenerationCallbacks = {}): Promise<GenerationResult> {
		return this.service.run(config, callbacks);
	}
}

export default GenerationController;
