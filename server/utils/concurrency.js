const VERSION_CONFLICT_MESSAGE =
	"This resource was modified by someone else. Please refresh and try again.";

const isVersionConflict = (error) => error?.name === "VersionError";

const sendVersionConflict = (res) =>
	res.status(409).json({
		success: false,
		message: VERSION_CONFLICT_MESSAGE,
	});

module.exports = {
	VERSION_CONFLICT_MESSAGE,
	isVersionConflict,
	sendVersionConflict,
};
