type Hook = () => void | Promise<void>

// Doing this manually as node:events has no async support
const SHUTDOWN_HOOKS = new Set<Hook>();

const events = {
	onShutdown: (hook: Hook) => {
		SHUTDOWN_HOOKS.add(hook);

		return () => {
			SHUTDOWN_HOOKS.delete(hook);
		};
	}
};

const appShutdown = async () => {
	for (const hook of SHUTDOWN_HOOKS) {
		try {
			await hook();
		} catch (error) {
			console.error('CRITICAL: Failed to run shutdown task!', error);
		}
	}
};

process.on('SIGINT', appShutdown);
process.on('SIGTERM', appShutdown);
// process.on('uncaughtException', appShutdown);

export default events;