import "./home.css";
import "./dice.css";

import { useState, useEffect } from "react";

function Home() {

    const [dices, setDices] = useState<JSX.Element[]>([]);

    useEffect(() => {

        type SideRebound = "left" | "right" | "top" | "bottom" | null;
        class Dice {

            constructor(public number: number, public xPos: number, public yPos: number) {
                this.number = number;
                this.xPos = xPos;
                this.yPos = yPos;

                this.jsx = <div className={`dice dice${this.number} flex`} key={this.number}>
                    <div className={`diceTurnAnimateCont diceTurnAnimateCont${this.number} diceTurned`}>
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
            
            readonly jsx: JSX.Element
            
            readonly diceSize: number = 100;   // El ancho del dado (en px) tiene que coincidir con el del css 
            private dice: HTMLDivElement | null = null;
            private diceTurnAnimateCont: HTMLDivElement | null = null;
            private diceSideExternals: NodeListOf<Element> | undefined = undefined;
            diceMoveAnimation: Animation | undefined = undefined;
            diceTurnAnimation: Animation | undefined = undefined;

            private getDomElements = () => {
                const dice: HTMLDivElement | null = document.querySelector(`.dice${this.number}`);
                const diceTurnAnimateCont: HTMLDivElement | null = document.querySelector(`.diceTurnAnimateCont${this.number}`);
                const diceSideExternals = dice?.querySelectorAll(".diceSideExternal");
                this.dice = dice;
                this.diceTurnAnimateCont = diceTurnAnimateCont;
                this.diceSideExternals = diceSideExternals;
            }

            private stopVelocity = 0.6;
            private celeration = - 0.0025;
            private Vmax = 5;
            private stopDegreesTolerance = 5;
            private velocityVector = { x: 0, y: 0 };
            private decelerationFuncMin = this.stopVelocity / this.Vmax;
            private motionDuration = 0;
            private oneTurnDuration = 0;
            private ti = 0;
            private isReboundLeft = false;
            private isReboundRight = false;
            private isReboundTop = false;
            private isReboundBottom = false;
            private playBakcRateIntervalId: NodeJS.Timer | undefined = undefined;
                                                                    
            setVelocityVector = (x: number, y: number) => {
                this.velocityVector.x = x;
                this.velocityVector.y = y;
            }

            decelerationFunc = (t: number): number => {                              
                const result = ((- 1 / this.motionDuration) * t) + 1;
                return result > this.decelerationFuncMin ? result : this.decelerationFuncMin * 0.8;
            }
                                                                                                  
            playBackRateUpdate = () => {
                const t = Date.now() - this.ti;
                if (this.diceTurnAnimation && this.diceMoveAnimation) {
                    this.diceTurnAnimation.playbackRate = this.decelerationFunc(t);
                    this.diceMoveAnimation.playbackRate = this.decelerationFunc(t);
                }
                requestAnimationFrame(this.playBackRateUpdate)
            }    

            getVelocityVector = () => {
                const t = Date.now() - this.ti;
                const Vx = this.velocityVector.x * this.decelerationFunc(t);
                const Vy = this.velocityVector.y * this.decelerationFunc(t);
                return { x: Vx, y: Vy };
            }

            getVelocity = () => Math.sqrt((this.getVelocityVector().x ** 2) + (this.getVelocityVector().y ** 2));
            
            getPosition = () => {
                const diceRect = this.dice?.getBoundingClientRect();
                const x = diceRect!.left + (this.diceSize / 2);
                const y = diceRect!.top + (this.diceSize / 2);
                return { x: Math.floor(x), y: Math.floor(y) };
            }

            setPosition = (x: number, y: number) => {
                this.diceMoveAnimation?.cancel();
                this.dice!.style.left = `${x - (this.diceSize / 2)}px`;
                this.dice!.style.top = `${y - (this.diceSize / 2)}px`;
            }

            getCurrentYRotation = (): number => {            //Obtiene el angulo de rotacion en el eje y actual
                const computedStyle = getComputedStyle(this.diceTurnAnimateCont!);
                const transformMatrix = new DOMMatrix(computedStyle.transform);
                const rotateYAngle = Math.atan2(transformMatrix.m13, transformMatrix.m33) * (180 / Math.PI);
                return rotateYAngle; // Return the Y rotation angle in degrees
            }

            readonly getSideDistance = {           /* Calcula la distancia del dado a un determinado borde de la ventana visual (window) */
                left: () => {
                    const sides = this.diceSideExternals;
                    const sidesArr = Array.from(sides!)
                    const sidesLeft = sidesArr.map((side) => side.getBoundingClientRect().left)
                    return Math.min(...sidesLeft);
                },
                right: () => {
                    const sides = this.diceSideExternals;
                    const sidesArr = Array.from(sides!)
                    const sidesRight = sidesArr.map((side) => window.innerWidth - side.getBoundingClientRect().right)
                    return Math.min(...sidesRight);
                },
                top: () => {
                    const sides = this.diceSideExternals;
                    const sidesArr = Array.from(sides!)
                    const sidesTop = sidesArr.map((side) => side.getBoundingClientRect().top)
                    return Math.min(...sidesTop);
                },
                bottom: () => {
                    const sides = this.diceSideExternals;
                    const sidesArr = Array.from(sides!)
                    const sidesBottom = sidesArr.map((side) => window.innerHeight - side.getBoundingClientRect().bottom)
                    return Math.min(...sidesBottom);
                }
            }

            private setdiceTurnAnimation = (currentYRotation: number) => {       /* Animacion de rotacion del dado */
                const reboundDirectionVector = { x: this.velocityVector.x, y: this.velocityVector.y };
                const reboundgAngle = Math.floor(Math.atan2(reboundDirectionVector.y, reboundDirectionVector.x) * 180 / Math.PI);     //Angulo de tiro
                this.diceTurnAnimation = this.diceTurnAnimateCont?.animate([
                    // keyframes
                    { transform: `rotateZ(${reboundgAngle}deg) rotateY(${-currentYRotation}deg) rotateX(0) translateZ(${this.diceSize / 2}px) translateX(${-(this.diceSize / 2)}px)` },
                    { transform: `rotateZ(${reboundgAngle}deg) rotateY(${-currentYRotation + 360}deg) rotateX(0) translateZ(${this.diceSize / 2}px) translateX(${-(this.diceSize / 2)}px)` }
                ], {
                    // timing options
                    duration: this.oneTurnDuration,
                    iterations: Infinity,
                    fill: "forwards",
                    easing: "linear"
                });
            }

            private setdiceMoveAnimation = (Vx: number, Vy: number) => {      /* Animacion de translacion del dado */
                const timeLeft = this.motionDuration;
                const reboundAx = Vx * timeLeft;
                const reboundAy = Vy * timeLeft;

                this.diceMoveAnimation = this.dice?.animate([
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

            private stopControlInit = () => {
                const stopControl = () => {
                    if (this.getVelocity() < this.stopVelocity) {
                        const actualYrotation = this.getCurrentYRotation();
                        if (
                            (Math.abs(actualYrotation) % 90 <= this.stopDegreesTolerance) ||
                            (Math.abs(actualYrotation) < 90 && Math.abs(actualYrotation) >= (90 - this.stopDegreesTolerance)) //Incluimos angulos menores y cercanos a 90º como 85º que  no son "detectados" por el algoritmo con "%"
                        ) {
                            clearInterval(this.playBakcRateIntervalId);
                            this.diceTurnAnimation?.pause();
                            this.diceMoveAnimation?.pause();
                        }
                    }
                    requestAnimationFrame(stopControl);
                }
                requestAnimationFrame(stopControl);
            }

            private playBackRateUpdateInit = () => {
                requestAnimationFrame(this.playBackRateUpdate);
            }

            private bordersReboundcontrolInit = () => {

                this.isReboundLeft = false;
                this.isReboundRight = false;
                this.isReboundTop = false;
                this.isReboundBottom = false;
                              
                let reboundSide: SideRebound = null;
                const reboundControl = () => {
                    
                    if (this.getSideDistance.left() <= 0 && !this.isReboundLeft) {
                        reboundSide = "left"
                    } else if (this.getSideDistance.right() <= 0 && !this.isReboundRight) {
                        reboundSide = "right";
                    } else if (this.getSideDistance.top() <= 0 && !this.isReboundTop) {
                        reboundSide = "top";
                    } else if (this.getSideDistance.bottom() <= 0 && !this.isReboundBottom) {
                        reboundSide = "bottom";
                    } else {
                        reboundSide = null;
                    }

                    if (reboundSide) {
                        
                        const impactPosition = { x: this.getPosition().x, y: this.getPosition().y };
                        const impactCurrentYRotation = this.getCurrentYRotation();

                        if (reboundSide === "left" || reboundSide === "right") {
                            this.setPosition(impactPosition.x, impactPosition.y);
                            this.setVelocityVector(-this.velocityVector.x, this.velocityVector.y);
                            this.diceTurnAnimation?.cancel();
                            this.diceMoveAnimation?.cancel();
                            this.setdiceTurnAnimation(impactCurrentYRotation);
                            this.setdiceMoveAnimation(this.velocityVector.x, this.velocityVector.y);
                            if (reboundSide === "left") {
                                this.isReboundRight = false;
                                this.isReboundLeft = true;
                            } else {
                                this.isReboundRight = true;
                                this.isReboundLeft = false;
                            }
                        } else if (reboundSide === "top" || reboundSide === "bottom") {
                            this.setPosition(impactPosition.x, impactPosition.y);
                            this.setVelocityVector(this.velocityVector.x, -this.velocityVector.y);
                            this.diceTurnAnimation?.cancel();
                            this.diceMoveAnimation?.cancel();
                            this.setdiceTurnAnimation(impactCurrentYRotation);
                            this.setdiceMoveAnimation(this.velocityVector.x, this.velocityVector.y);
                            if (reboundSide === "top") {
                                this.isReboundTop = true;
                                this.isReboundBottom = false;
                            } else {
                                this.isReboundTop = false;
                                this.isReboundBottom = true;
                            }
                        }
                    }
                    requestAnimationFrame(reboundControl);  
                }
                requestAnimationFrame(reboundControl);                
            }
           
            place = () => {
                this.getDomElements();
                this.dice!.style.left = `${this.xPos - (this.diceSize / 2)}px`;          //- (diceSize/2) Para que posicione en el cursor el centro del dado
                this.dice!.style.top = `${this.yPos - (this.diceSize / 2)}px`;
                               
                let isMouseDown = false;
                let isMouseOver = false;
                const motionLog: { x: number, y: number, t: number }[] = new Array(5);
                for (let i = 0; i < 5; i++) {
                    motionLog[i] = { x: 0, y: 0, t: 0 };
                }
                
                const pointerup = () => {                                                                      //Se entra a esta funcion al soltar el dado
                    if (isMouseOver) {                                                                         // y si el cursor esta sobre el
                        if (motionLog[4].x - motionLog[0].x !== 0 || motionLog[4].y - motionLog[0].y !== 0) {  //Verificamos que hayamos movido el dado (al menos en x o en y) para poder arrojarlo
                            
                            this.diceTurnAnimateCont?.classList.remove("diceTurned");
                            this.dice?.getAnimations({ subtree: true }).forEach(animation => {
                                animation.cancel();
                            })
                                                        
                            const Axi = motionLog[4].x - motionLog[0].x;
                            const Ayi = motionLog[4].y - motionLog[0].y;
                            const At = motionLog[4].t - motionLog[0].t;
                            let Vxi = Axi / At;        // px/ms
                            let Vyi = Ayi / At;        // px/ms
                            const shootingAngle = (Math.atan2(-Ayi, Axi) / Math.PI) * 180;
                            this.setVelocityVector(Vxi, Vyi);
                            let Vi = Math.sqrt((this.velocityVector.x ** 2) + (this.velocityVector.y ** 2));

                            if (Vi > this.Vmax) {
                                this.velocityVector.x = this.Vmax * Math.cos((shootingAngle / 180) * Math.PI);
                                this.velocityVector.y = - this.Vmax * Math.sin((shootingAngle / 180) * Math.PI);
                                Vxi = this.velocityVector.x;
                                Vyi = this.velocityVector.y;
                                Vi = this.Vmax;
                            }                    

                            this.motionDuration = Math.abs((this.stopVelocity - Vi) / (this.celeration));                                             //La duracion del movimiento del dato hasta que se queda quieto es proporcional a la velocidad de tiro
                            this.oneTurnDuration = (4 * this.diceSize) / Vi;
                            this.ti = Date.now();
                            this.oneTurnDuration = ((4 * this.diceSize) / Vi);
                            this.setdiceTurnAnimation(this.getCurrentYRotation());
                            this.setdiceMoveAnimation(Vxi, Vyi);
                            this.bordersReboundcontrolInit();
                            this.stopControlInit(); 
                            this.playBackRateUpdateInit();
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
                        if (this.dice) {
                            motionLog.push({ x: e.clientX, y: e.clientY, t: Date.now() });
                            motionLog.shift();
                            this.dice.style.left = `${e.clientX - (this.diceSize / 2)}px`;          //- (diceSize/2) Para que posicione en el cursor el centro del dado
                            this.dice.style.top = `${e.clientY - (this.diceSize / 2)}px`;
                        }
                    }
                }

                const pointerdown = (e: any) => {
                    const diceAnimations = this.dice?.getAnimations({ subtree: true });
                    diceAnimations?.forEach((animation) => {
                        animation.cancel();
                    })
                    this.diceTurnAnimateCont?.classList.add("diceTurned");
                    this.dice!.style.left = `${e.clientX - (this.diceSize / 2)}px`;          //- (diceSize/2) Para que posicione en el cursor el centro del dado
                    this.dice!.style.top = `${e.clientY - (this.diceSize / 2)}px`;
                    isMouseDown = true;
                }


                this.diceSideExternals?.forEach((side) => {
                    side.addEventListener("pointerdown", pointerdown);
                })

                document.addEventListener("pointerup", pointerup);

                this.diceSideExternals?.forEach((side) => {
                    side.addEventListener("pointerover", pointerover);
                })

                this.diceSideExternals?.forEach((side) => {
                    side.addEventListener("pointerleave", pointerleave);
                })

                document.addEventListener("pointermove", pointermove);
            }
        }

        const register = (dice0: Dice, dice1: Dice) => {

            const getDistance = (): number => {
                const dice0Left = dice0.getSideDistance.left();
                const dice0Right = dice0.getSideDistance.right();
                const dice0Width = window.innerWidth - dice0Left - dice0Right;
                const dice0limitLeft = dice0Left;
                const dice0limitRight = dice0limitLeft + dice0Width;

                const dice1Left = dice1.getSideDistance.left();
                const dice1Right = dice1.getSideDistance.right();
                const dice1Width = window.innerWidth - dice1Left - dice1Right;
                const dice1limitLeft = dice1Left;
                const dice1limitRight = dice1limitLeft + dice1Width;

                if (dice0limitRight < dice1limitLeft) {
                    return dice1limitLeft - dice0limitRight
                } else if (dice0limitLeft > dice1limitRight) {
                    return dice0limitLeft - dice1limitRight
                }
                
                const dice0Top = dice0.getSideDistance.top();
                const dice0Bottom = dice0.getSideDistance.bottom();
                const dice0Height = window.innerHeight - dice0Top - dice0Bottom;
                const dice0limitTop = dice0Top;
                const dice0limitBottom = dice0limitTop + dice0Height;

                const dice1Top = dice1.getSideDistance.top();
                const dice1Bottom = dice1.getSideDistance.bottom();
                const dice1Height = window.innerHeight - dice1Top - dice1Bottom;
                const dice1limitTop = dice1Top;
                const dice1limitBottom = dice1limitTop + dice1Height;

                if (dice0limitBottom < dice1limitTop) {
                    return dice1limitTop - dice0limitBottom
                } else if (dice0limitTop > dice1limitBottom) {
                    return dice0limitTop - dice1limitBottom
                }

                return 0;
            }

            const impactController = () => {
                if (getDistance() <= 0) {
                    dice0.diceMoveAnimation?.pause();
                    dice0.diceTurnAnimation?.pause();
                    dice1.diceMoveAnimation?.pause();
                    dice1.diceTurnAnimation?.pause();
                }
                requestAnimationFrame(impactController);
            }

           requestAnimationFrame(impactController);
        }

        const dice0 = new Dice(0, 1000, 500);
        const dice1 = new Dice(1, 960, 500);

        setDices([dice0.jsx, dice1.jsx]);

        setTimeout(() => {
            dice0.place();
            dice1.place();
            register(dice0, dice1);
        }, 100);
        
    }, [])

    return (
        <div className="seccion rubikSeccion flex">
            {dices}
        </div>
    )
}

export default Home