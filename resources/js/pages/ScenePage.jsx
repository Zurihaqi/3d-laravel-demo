import React, { useRef } from "react";
import {
    Vector3,
    HemisphericLight,
    ArcRotateCamera,
    Matrix,
    AssetsManager,
} from "@babylonjs/core";
import SceneComponent from "@/components/SceneComponent";
import "@babylonjs/loaders/glTF/2.0";

const onSceneReady = async (scene, pointArrayRef, buttonsContainerRef) => {
    const camera = new ArcRotateCamera(
        "camera1",
        Math.PI / 4,
        Math.PI / 4,
        10,
        Vector3.Zero(),
        scene
    );
    camera.attachControl(scene.getEngine().getRenderingCanvas(), true);

    new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    const assetsManager = new AssetsManager(scene);
    const meshTask = assetsManager.addMeshTask(
        "mainframe",
        "",
        "/models/",
        "mainframe.glb"
    );

    meshTask.onSuccess = (task) => {
        console.log("Loaded meshes:", task.loadedMeshes);
        if (task.loadedMeshes.length > 0) {
            task.loadedMeshes[0].scaling = new Vector3(1, 1, 1);
            task.loadedMeshes[0].position = Vector3.Zero();
        }
    };

    meshTask.onError = (task, message, exception) => {
        console.error("Loading failed:", message, exception);
    };

    assetsManager.load();

    scene.onPointerDown = (evt, pickResult) => {
        if (pickResult.hit && pickResult.pickedPoint) {
            pointArrayRef.current.push({
                id: pointArrayRef.current.length,
                position: pickResult.pickedPoint.clone(),
            });

            const button = document.createElement("button");
            button.textContent = pointArrayRef.current.length - 1;
            button.style.position = "absolute";
            buttonsContainerRef.current.appendChild(button);
        }
    };

    scene.onBeforeRenderObservable.add(() => {
        const width = scene.getEngine().getRenderWidth();
        const height = scene.getEngine().getRenderHeight();

        pointArrayRef.current.forEach((point, idx) => {
            const projected = Vector3.Project(
                point.position,
                Matrix.Identity(),
                scene.getTransformMatrix(),
                camera.viewport.toGlobal(width, height)
            );

            const button = buttonsContainerRef.current.children[idx];
            if (button) {
                if (projected.z < 0 || projected.z > 1) {
                    button.style.display = "none";
                } else {
                    button.style.display = "block";
                    button.style.left = `${projected.x}px`;
                    button.style.top = `${projected.y}px`;
                    button.style.borderRadius = "100%";
                    button.style.borderWidth = "1px";
                    button.style.borderStyle = "solid";
                    button.style.width = "2rem";
                    button.style.height = "2rem";
                    button.style.backgroundColor = "black";
                    button.style.color = "white";
                }
            }
        });
    });
};

const onRender = (scene) => {
    // nothing needed per frame unless you want to animate box
};

export default () => {
    const pointArrayRef = useRef([]);
    const buttonsContainerRef = useRef(null);

    fetch("/models/rearcross.glb").then((r) => console.log(r.status));

    return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <SceneComponent
                antialias
                onSceneReady={(scene) =>
                    onSceneReady(scene, pointArrayRef, buttonsContainerRef)
                }
                onRender={onRender}
                id="my-canvas"
            />

            <div
                ref={buttonsContainerRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                }}
            />
        </div>
    );
};
