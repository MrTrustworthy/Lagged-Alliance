/**
 * Created by mt on 20.02.2015.
 */

var EnvTypes = {

    cornerNE: {
        name: "cornerNE",
        model: {
            geometryName: "cornerwall",
            transformParams: {
                rotateX: Math.PI/2
            },
            textureName: "tree"
        }
    },
    cornerSE: {
        name: "cornerSE",
        model: {
            geometryName: "cornerwall",
            transformParams: {
                rotateX: Math.PI/2,
                rotateY: -Math.PI/2
            },
            textureName: "tree"
        }
    },
    cornerSW: {
        name: "cornerSW",
        model: {
            geometryName: "cornerwall",
            transformParams: {
                rotateX: Math.PI/2,
                rotateY: -Math.PI
            },
            textureName: "tree"
        }
    },
    cornerNW: {
        name: "cornerNW",
        model: {
            geometryName: "cornerwall",
            transformParams: {
                rotateX: Math.PI/2,
                rotateY: Math.PI/2
            },
            textureName: "tree"
        }
    },
    wallHorizontal: {
        name: "wallHorizontal",
        model: {
            geometryName: "wall",
            transformParams: {
                rotateX: Math.PI/2
            },
            textureName: "tree"
        }
    },
    wallVertical: {
        name: "wallVertical",
        model: {
            geometryName: "wall",
            transformParams: {
                rotateX: Math.PI/2,
                rotateY: Math.PI/2
            },
            textureName: "tree"
        }
    }




};
