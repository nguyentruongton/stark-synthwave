import { Card, ProgressIndicator, Text } from "@bug-on/m3-expressive";

export function RouteLoadingFallback() {
	return (
		<div className="w-full flex items-center justify-center py-20 px-4 animate-in fade-in duration-200">
			<Card
				variant="filled"
				className="flex flex-col items-center justify-center p-8 gap-4 max-w-sm w-full bg-m3-surface-container/70 backdrop-blur-md rounded-m3-extra-large border border-m3-outline-variant/30 shadow-md"
			>
				<ProgressIndicator
					variant="circular"
					aria-label="Đang tải dữ liệu..."
				/>
				<Text
					variant="body-md"
					className="text-m3-on-surface-variant font-medium tracking-wide animate-pulse"
				>
					Đang chuẩn bị module...
				</Text>
			</Card>
		</div>
	);
}
