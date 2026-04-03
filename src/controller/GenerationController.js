import GenerationService from '../service/GenerationService.js';

class GenerationController {
	constructor(boardSize = 8) {
		this.service = new GenerationService(boardSize);
	}

	async run(config, callbacks = {}) {
		return this.service.run(config, callbacks);
	}
}

export default GenerationController;
