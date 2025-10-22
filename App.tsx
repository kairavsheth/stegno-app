import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    Camera,
    Code,
    useCameraDevice,
    useCameraPermission,
    useCodeScanner,
} from "react-native-vision-camera";
import { Ionicons } from "@expo/vector-icons";

const QRScann: React.FC = () => {
    const device = useCameraDevice("back");

    const { hasPermission, requestPermission } = useCameraPermission();

    const [flash, setFlash] = useState<"on" | "off">("off");
    const [processing, setProcessing] = useState(false);
    const processingRef = useRef(false);
    const [initialized, setInitialized] = useState(false);
    const cameraRef = useRef<Camera | null>(null);
    const [teamName, setTeamName] = useState("");

    useEffect(() => {
        // make initialization robust to different hook shapes
        if (typeof hasPermission === "boolean") {
            if (!hasPermission) {
                requestPermission?.().finally(() => setInitialized(true));
            } else {
                setInitialized(true);
            }
        } else {
            // If hasPermission is a string like "authorized", treat it accordingly:
            if (hasPermission !== "authorized") {
                requestPermission?.().finally(() => setInitialized(true));
            } else {
                setInitialized(true);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasPermission, requestPermission]);

    const uploadPhoto = async (slug: string): Promise<void> => {
        if (!cameraRef.current) return;
        try {
            const snapshot = await cameraRef.current.takeSnapshot({
                quality: 85,
            });
            const srcFilePath = snapshot?.path ?? null;
            // do something with srcFilePath and slug...
            console.log("Snapshot path:", srcFilePath);
        } catch (err) {
            console.warn("takeSnapshot failed:", err);
        }
    };

    const handleCode = useCallback(
        async (code: string) => {
            if (!code || processingRef.current) return;

            processingRef.current = true;
            setProcessing(true);

            try {
                console.log("Handling QR code:", code, "teamName:", teamName);

            } catch (err) {
                console.warn("Error handling code:", err);
            } finally {
                // ALWAYS reset both ref and state so scanner can scan again
                processingRef.current = false;
                setProcessing(false);
            }
        },
        [teamName]
    );

    const codeScanner = useCodeScanner({
        codeTypes: ["qr"],
        onCodeScanned: (codes: Code[]) => {
            if (processingRef.current) return;
            if (codes.length > 0) {
                const code = codes[0].value;
                if (code) {
                    console.log("Detected QR:", code);
                    // don't await here — let handleCode manage state and ref
                    handleCode(code)
                        .then(() => console.log("QR scanned successfully."))
                        .catch((err) => console.warn("QR scan error:", err));
                }
            }
        },
    });

    // Waiting for device to be available & permissions to be initialized
    if (!initialized || device == null) {
        return (
            <View style={[styles.center, { flex: 1 }]}>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 10 }}>Loading camera...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={{ flex: 1 }}>
                <View style={styles.topBar}>
                    <View style={{ width: 40 }} />
                    <Text style={styles.title}>Scan QR</Text>
                    <TouchableOpacity
                        onPress={() => setFlash((f) => (f === "off" ? "on" : "off"))}
                        style={styles.flashButton}
                        accessibilityLabel="Toggle flash"
                    >
                        <Ionicons
                            name={flash === "on" ? "flash" : "flash-off"}
                            size={24}
                            color="#fff"
                        />
                    </TouchableOpacity>
                </View>

                <Camera
                    ref={cameraRef}
                    device={device}
                    isActive={true}
                    style={StyleSheet.absoluteFill}
                    // If your useCodeScanner returns a frameProcessor function, change
                    // the prop name to frameProcessor (frameProcessor={codeScanner}).
                    codeScanner={codeScanner}
                    torch={flash}
                    photo={true}
                />
            </View>

            {processing && (
                <View style={styles.processingOverlay} pointerEvents="none">
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            )}
        </View>
    );
};

export default QRScann;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "transparent",
    },
    center: {
        justifyContent: "center",
        alignItems: "center",
    },
    topBar: {
        position: "absolute",
        top: 20,
        zIndex: 10,
        width: "100%",
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between", // replace unsupported 'gap'
        // tiny shadow for visibility (optional)
    },
    title: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    flashButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
});
