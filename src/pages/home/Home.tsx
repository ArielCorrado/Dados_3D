import "./home.css";
import "./dice.css";

import { useState, useEffect } from "react";

function Home() {

    const [dices, setDices] = useState<JSX.Element[]>([]);

    useEffect(() => {

        class Dice {
            readonly jsx: JSX.Element

            constructor(public number: number, public xPos: number, public yPos: number) {
                this.number = number;
                this.xPos = xPos;
                this.yPos = yPos;

                this.jsx = <div className="dice flex" key={this.number}>
                    <div className="diceTurnAnimateCont diceTurned">
                        <div className="diceSide diceSideExternal diceSide1 flex"></div>
                        <div className="diceSide diceSideExternal diceSide2 flex"></div>
                        <div className="diceSide diceSideExternal diceSide3 flex"></div>
                        <div className="diceSide diceSideExternal diceSide4 flex"></div>
                        <div className="diceSide diceSideExternal diceSide5 flex"></div>
                        <div className="diceSide diceSideExternal diceSide6 flex"></div>

                        <div className="diceSide flex"></div>
                        <div className="diceSide flex"></div>
                        <div className="diceSide flex"></div>

                        <div className="diceSide flex"></div>
                        <div className="diceSide flex"></div>
                        <div className="diceSide flex"></div>
                        <div className="diceSide flex"></div>
                        <div className="diceSide flex"></div>
                        <div className="diceSide flex"></div>
                    </div>
                </div>
            }

            run = () => {
                const diceSize = 100; // El ancho del dado (en px) tiene que coincidir con el del css   

                const dices = document.querySelectorAll(".dice");
                dices[this.number].classList.add(`dice${this.number}`);

                const diceTurnAnimatesConts = document.querySelectorAll(".diceTurnAnimateCont");
                diceTurnAnimatesConts[this.number].classList.add(`diceTurnAnimateCont${this.number}`);

                let isMouseDown = false;
                let isMouseOver = false;
                const motionLog: { x: number, y: number, t: number }[] = new Array(5);
                for (let i = 0; i < motionLog.length; i++) {
                    motionLog[i] = { x: 0, y: 0, t: 0 };
                }

                const dice: HTMLDivElement | null = document.querySelector(`.dice${this.number}`);
                const diceTurnAnimateCont: HTMLDivElement | null = document.querySelector(`.diceTurnAnimateCont${this.number}`);

                const diceSideExternals = dice?.querySelectorAll(".diceSideExternal");
                diceSideExternals?.forEach((diceSide) => {
                    diceSide.classList.add(`diceSideExternal${this.number}`);
                })

                dice!.style.left = `${this.xPos - (diceSize / 2)}px`;          //- (diceSize/2) Para que posicione en el cursor el centro del dado
                dice!.style.top = `${this.yPos - (diceSize / 2)}px`;

                const getCurrentYRotation = (): number => {            //Obtiene el angulo de rotacion en el eje y actual
                    const computedStyle = getComputedStyle(diceTurnAnimateCont!);
                    const transformMatrix = new DOMMatrix(computedStyle.transform);
                    const rotateYAngle = Math.atan2(transformMatrix.m13, transformMatrix.m33) * (180 / Math.PI);
                    return rotateYAngle; // Return the Y rotation angle in degrees
                }

                const pointerup = () => {                                                                      //Se entra a esta funcion al soltar el dado
                    if (isMouseOver) {                                                                         // y si el cursor esta sobre el
                        if (motionLog[4].x - motionLog[0].x !== 0 || motionLog[4].y - motionLog[0].y !== 0) {  //Verificamos que hayamos movido el dado (al menos en x o en y) para poder arrojarlo

                            // setRandomDice();
                            diceTurnAnimateCont?.classList.remove("diceTurned");
                            dice?.getAnimations({ subtree: true }).forEach(animation => {
                                animation.cancel();
                            })

                            const velocityVector = { x: 0, y: 0 };
                            const setVelocityVector = (x: number, y: number) => {
                                velocityVector.x = x;
                                velocityVector.y = y;
                            }

                            const Axi = motionLog[4].x - motionLog[0].x;
                            const Ayi = motionLog[4].y - motionLog[0].y;
                            const At = motionLog[4].t - motionLog[0].t;
                            let Vxi = Axi / At;        // px/ms
                            let Vyi = Ayi / At;        // px/ms
                            setVelocityVector(Vxi, Vyi);
                            const Vi = Math.sqrt((velocityVector.x ** 2) + (velocityVector.y ** 2));

                            const stopVelocity = 0.575;
                            const aceleration = - 0.005;
                            let motionDuration = Math.abs((stopVelocity - Vi) / aceleration);                                             //La duracion del movimiento del dato hasta que se queda quieto es proporcional a la velocidad de tiro
                            let oneTurnDuration = (4 * diceSize) / Vi;

                            let diceMoveAnimation: Animation | undefined;
                            let diceTurnAnimation: Animation | undefined;

                            /**************** Limitador de velocidad de tiro ***************/
                            const Vmax = 3;
                            if (Math.abs(velocityVector.x) >= Math.abs(velocityVector.y)) {
                                if (Math.abs(velocityVector.x) > Vmax) {
                                    const Vxi = velocityVector.x;
                                    const VxSign = Math.abs(velocityVector.x) / velocityVector.x;
                                    velocityVector.x = Vmax * VxSign;
                                    velocityVector.y = (Math.abs(Vmax / Vxi)) * velocityVector.y
                                }
                            } else {
                                if (Math.abs(velocityVector.y) > Vmax) {
                                    const Vyi = velocityVector.y;
                                    const VySign = Math.abs(velocityVector.y) / velocityVector.y;
                                    velocityVector.y = Vmax * VySign;
                                    velocityVector.x = (Math.abs(Vmax / Vyi)) * velocityVector.x
                                }
                            }

                            const stopDegreesTolerance = 5;
                            const stopControl = () => {
                                if (getVelocity() < stopVelocity) {
                                    const actualYrotation = getCurrentYRotation();
                                    if (
                                        (Math.abs(actualYrotation) % 90 <= stopDegreesTolerance) ||
                                        (Math.abs(actualYrotation) < 90 && Math.abs(actualYrotation) >= (90 - stopDegreesTolerance)) //Incluimos angulos menores y cercanos a 90º como 85º que  no son "detectados" por el algoritmo con "%"
                                    ) {
                                        setTimeout(() => {
                                            clearInterval(controlIntervalId);
                                            clearInterval(playBakcRateIntervalId);
                                        }, 100);
                                        diceTurnAnimation?.pause();
                                        diceMoveAnimation?.pause();
                                    }
                                } else if (Vi < 1.1) {
                                    // diceTurnAnimation?.pause();
                                }
                            }

                            const decelerationFuncMin = (stopVelocity / Vi);                                //La funcion de desaceleracion no tiene que hacer descender la velocidad por debajo
                            const decelerationFuncAdjust = decelerationFuncMin * 0.9;                       // de stopVelocity para que el dado no se pare entes de que actue el "stopControl"
                            const decelerationFunc = (t: number): number => {                              //Funcion de desaceleracion (su valor inicial es 1 --> (t = 0))
                                const result = (((stopVelocity - Vi) / (Vi * motionDuration)) * t) + 1;
                                return result >= decelerationFuncMin ? result : decelerationFuncAdjust;
                            }

                            const playBackRateUpdate = () => {
                                const t = Date.now() - ti;
                                if (diceTurnAnimation && diceMoveAnimation) {
                                    diceTurnAnimation.playbackRate = decelerationFunc(t);
                                    diceMoveAnimation.playbackRate = decelerationFunc(t);
                                }
                            }

                            const getPosition = () => {
                                const diceRect = dice?.getBoundingClientRect();
                                const x = diceRect!.left + (diceSize / 2);
                                const y = diceRect!.top + (diceSize / 2);
                                return { x: Math.floor(x), y: Math.floor(y) };
                            }

                            const setPosition = (x: number, y: number) => {
                                diceMoveAnimation?.cancel();
                                dice!.style.left = `${x - (diceSize / 2)}px`;
                                dice!.style.top = `${y - (diceSize / 2)}px`;
                            }

                            const getVelocityVector = () => {
                                const t = Date.now() - ti;
                                const Vx = velocityVector.x * decelerationFunc(t);
                                const Vy = velocityVector.y * decelerationFunc(t);
                                return { x: Vx, y: Vy };
                            }

                            const getVelocity = () => Math.sqrt(getVelocityVector().x ** 2 + getVelocityVector().y ** 2);

                            const getSideDistance = {           /* Calcula la distancia del dado a un determinado borde de la ventana visual (window) */
                                left: () => {
                                    const sides = diceSideExternals;
                                    const sidesArr = Array.from(sides!)
                                    const sidesLeft = sidesArr.map((side) => side.getBoundingClientRect().left)
                                    return Math.min(...sidesLeft);
                                },
                                right: () => {
                                    const sides = diceSideExternals;
                                    const sidesArr = Array.from(sides!)
                                    const sidesRight = sidesArr.map((side) => window.innerWidth - side.getBoundingClientRect().right)
                                    return Math.min(...sidesRight);
                                },
                                top: () => {
                                    const sides = diceSideExternals;
                                    const sidesArr = Array.from(sides!)
                                    const sidesTop = sidesArr.map((side) => side.getBoundingClientRect().top)
                                    return Math.min(...sidesTop);
                                },
                                bottom: () => {
                                    const sides = diceSideExternals;
                                    const sidesArr = Array.from(sides!)
                                    const sidesBottom = sidesArr.map((side) => window.innerHeight - side.getBoundingClientRect().bottom)
                                    return Math.min(...sidesBottom);
                                }
                            }

                            const setDiceTurnAnimation2 = (currentYRotation: number) => {       /* Animacion de rotacion del dado */
                                const reboundDirectionVector = { x: getVelocityVector().x, y: getVelocityVector().y };
                                const reboundgAngle = Math.floor(Math.atan2(reboundDirectionVector.y, reboundDirectionVector.x) * 180 / Math.PI);     //Angulo de tiro
                                diceTurnAnimation = diceTurnAnimateCont?.animate([
                                    // keyframes
                                    { transform: `rotateZ(${reboundgAngle}deg) rotateY(${-currentYRotation}deg) rotateX(0) translateZ(${diceSize / 2}px) translateX(${-(diceSize / 2)}px)` },
                                    { transform: `rotateZ(${reboundgAngle}deg) rotateY(${-currentYRotation + 360}deg) rotateX(0) translateZ(${diceSize / 2}px) translateX(${-(diceSize / 2)}px)` }
                                ], {
                                    // timing options
                                    duration: oneTurnDuration,
                                    iterations: Infinity,
                                    fill: "forwards",
                                    easing: "linear"
                                });
                            }

                            const setDiceMoveAnimation = (Vx: number, Vy: number) => {      /* Animacion de translacion del dado */

                                const timeLeft = motionDuration;
                                const reboundAx = Vx * timeLeft;
                                const reboundAy = Vy * timeLeft;

                                diceMoveAnimation = dice?.animate([
                                    // keyframes
                                    { transform: `translateX(0) translateY(0)` },
                                    { transform: `translateX(${reboundAx}px) translateY(${reboundAy}px)` }
                                ], {
                                    // timing options
                                    duration: timeLeft,
                                    fill: "forwards",
                                    easing: "linear"
                                });
                            }

                            const ti = Date.now();
                            const playBakcRateIntervalId = setInterval(() => {
                                playBackRateUpdate();
                            }, 10);
                            oneTurnDuration = ((4 * diceSize) / Vi);
                            setDiceTurnAnimation2(getCurrentYRotation());
                            setDiceMoveAnimation(Vxi, Vyi);

                            let isReboundLeft = false;
                            let isReboundRight = false;
                            let isReboundTop = false;
                            let isReboundBottom = false;

                            const fastReboundVelocity = 1;
                            type SideRebound = "left" | "right" | "top" | "bottom" | null;
                            let reboundSide: SideRebound = null;

                            const reboundControl = () => {
                                next = false;

                                if (getSideDistance.left() <= 0 && !isReboundLeft) {
                                    reboundSide = "left"
                                } else if (getSideDistance.right() <= 0 && !isReboundRight) {
                                    reboundSide = "right";
                                } else if (getSideDistance.top() <= 0 && !isReboundTop) {
                                    reboundSide = "top";
                                } else if (getSideDistance.bottom() <= 0 && !isReboundBottom) {
                                    reboundSide = "bottom";
                                } else {
                                    reboundSide = null;
                                }

                                if (reboundSide) {
                                    const impactPosition = { x: getPosition().x, y: getPosition().y };
                                    const impactCurrentYRotation = getCurrentYRotation();
                                    const impactVelocityVector = { x: getVelocityVector().x, y: getVelocityVector().y };
                                    const impactVelocity = getVelocity();
                                    oneTurnDuration = ((4 * diceSize) / impactVelocity);
                                    if (impactVelocity < fastReboundVelocity && impactVelocity > stopVelocity) oneTurnDuration = ((4 * diceSize) / (impactVelocity * 1.75)); //Giro mas rapido al rebotar a menos de "fastReboundVelocity". 

                                    if (reboundSide === "left" || reboundSide === "right") {
                                        if (impactVelocity >= stopVelocity) {
                                            setPosition(impactPosition.x, impactPosition.y);
                                            setVelocityVector(-impactVelocityVector.x, impactVelocityVector.y);
                                            diceTurnAnimation?.cancel();
                                            diceMoveAnimation?.cancel();
                                            setDiceTurnAnimation2(impactCurrentYRotation);
                                            setDiceMoveAnimation(-impactVelocityVector.x, impactVelocityVector.y);
                                        } else {                                                                                        //Rebote sin girar a menos de "stopVelocity"
                                            setPosition(impactPosition.x, impactPosition.y);
                                            setVelocityVector(-impactVelocityVector.x, impactVelocityVector.y);
                                            diceMoveAnimation?.cancel();
                                            setDiceMoveAnimation(-impactVelocityVector.x, impactVelocityVector.y);
                                        }
                                        if (reboundSide === "left") {
                                            isReboundRight = false;
                                            isReboundLeft = true;
                                        } else {
                                            isReboundRight = true;
                                            isReboundLeft = false;
                                        }
                                    } else if (reboundSide === "top" || reboundSide === "bottom") {
                                        if (impactVelocity >= stopVelocity) {
                                            setPosition(impactPosition.x, impactPosition.y);
                                            setVelocityVector(impactVelocityVector.x, -impactVelocityVector.y);
                                            diceTurnAnimation?.cancel();
                                            diceMoveAnimation?.cancel();
                                            setDiceTurnAnimation2(impactCurrentYRotation);
                                            setDiceMoveAnimation(impactVelocityVector.x, -impactVelocityVector.y);
                                        } else {
                                            setPosition(impactPosition.x, impactPosition.y);
                                            setVelocityVector(-impactVelocityVector.x, impactVelocityVector.y);
                                            diceMoveAnimation?.cancel();
                                            setDiceMoveAnimation(impactVelocityVector.x, -impactVelocityVector.y);
                                        }
                                        if (reboundSide === "top") {
                                            isReboundTop = true;
                                            isReboundBottom = false;
                                        } else {
                                            isReboundTop = false;
                                            isReboundBottom = true;
                                        }
                                    }
                                }
                                next = true;
                            }

                            let next = true;
                            const controlIntervalId = setInterval(() => {
                                if (next) {
                                    reboundControl();
                                    stopControl();
                                }
                                // console.log(motionDuration, Date.now() - ti)
                            }, 1);

                        }
                        isMouseDown = false;
                    }
                }

                const pointerover = () => {
                    isMouseOver = true;
                }

                const pointerleave = () => {
                    if (!isMouseDown) {
                        isMouseOver = false;
                    }
                }

                const pointermove = (e: any) => {
                    if (isMouseDown) {
                        if (dice) {
                            motionLog.push({ x: e.clientX, y: e.clientY, t: Date.now() });
                            motionLog.shift();
                            dice.style.left = `${e.clientX - (diceSize / 2)}px`;          //- (diceSize/2) Para que posicione en el cursor el centro del dado
                            dice.style.top = `${e.clientY - (diceSize / 2)}px`;
                        }
                    }
                }

                const pointerdown = (e: any) => {
                    const diceAnimations = dice?.getAnimations({ subtree: true });
                    diceAnimations?.forEach((animation) => {
                        animation.cancel();
                    })
                    diceTurnAnimateCont?.classList.add("diceTurned");
                    dice!.style.left = `${e.clientX - (diceSize / 2)}px`;          //- (diceSize/2) Para que posicione en el cursor el centro del dado
                    dice!.style.top = `${e.clientY - (diceSize / 2)}px`;
                    isMouseDown = true;
                }


                diceSideExternals?.forEach((side) => {
                    side.addEventListener("pointerdown", pointerdown);
                })

                document.addEventListener("pointerup", pointerup);

                diceSideExternals?.forEach((side) => {
                    side.addEventListener("pointerover", pointerover);
                })

                diceSideExternals?.forEach((side) => {
                    side.addEventListener("pointerleave", pointerleave);
                })

                document.addEventListener("pointermove", pointermove);
            }
        }

        const dice0 = new Dice(0, 200, 500);
        const dice1 = new Dice(1, 500, 500);

        setDices([dice0.jsx, dice1.jsx]);

        setTimeout(() => {
            dice0.run();
            dice1.run();
        }, 500);

    }, [])

    return (
        <div className="seccion rubikSeccion flex">
            {dices}
        </div>
    )
}

export default Home