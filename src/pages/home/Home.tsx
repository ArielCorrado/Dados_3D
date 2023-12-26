import "./home.css";
import "./dice.css";

import { useState, useEffect } from "react";

function Home() {

    const [dices, setDices] = useState<JSX.Element[]>([]);

    useEffect(() => {

        type SideRebound = "left" | "right" | "top" | "bottom" | null;
        class Dice {

            constructor(public number: number, public xPos: number, public yPos: number, public color: string) {
                this.number = number;
                this.xPos = xPos;
                this.yPos = yPos;
                this.color = color;

                this.jsx = <div className={`dice dice${this.number} flex`} key={this.number}>
                    <div className={`diceTurnAnimateCont diceTurnAnimateCont${this.number} diceTurned`}>
                        <div className="diceSide diceSideExternal diceSide1 flex"></div>
                        <div className="diceSide diceSideExternal diceSide2 flex"></div>
                        <div className="diceSide diceSideExternal diceSide3 flex"></div>
                        <div className="diceSide diceSideExternal diceSide4 flex"></div>
                        <div className="diceSide diceSideExternal diceSide5 flex"></div>
                        <div className="diceSide diceSideExternal diceSide6 flex"></div>

                        <div className="diceSide diceSideLightColor flex"></div>
                        <div className="diceSide diceSideLightColor flex"></div>
                        <div className="diceSide diceSideLightColor flex"></div>

                        <div className="diceSide diceSideLightColor flex"></div>
                        <div className="diceSide diceSideLightColor flex"></div>
                        <div className="diceSide diceSideLightColor flex"></div>
                        <div className="diceSide diceSideLightColor flex"></div>
                        <div className="diceSide diceSideLightColor flex"></div>
                        <div className="diceSide diceSideLightColor flex"></div>
                    </div>
                </div>
            }
            
            readonly jsx: JSX.Element
                                                
            readonly diceSize: number = 100;   // El ancho del dado (en px) tiene que coincidir con el del css 
            private dice: HTMLDivElement | null = null;
            private diceTurnAnimateCont: HTMLDivElement | null = null;
            private diceSideExternals: NodeListOf <HTMLDivElement> | undefined = undefined;
            private diceSideLightColor: NodeListOf <HTMLDivElement> | undefined = undefined;
            diceMoveAnimation: Animation | undefined = undefined;
            diceTurnAnimation: Animation | undefined = undefined;

            private getDomElements = () => {
                const dice: HTMLDivElement | null = document.querySelector(`.dice${this.number}`);
                const diceTurnAnimateCont: HTMLDivElement | null = document.querySelector(`.diceTurnAnimateCont${this.number}`);
                const diceSideExternals: NodeListOf <HTMLDivElement> | undefined = dice?.querySelectorAll(".diceSideExternal") ;
                const diceSideLightColor: NodeListOf <HTMLDivElement> | undefined = dice?.querySelectorAll(".diceSideLightColor") ;
                this.dice = dice;
                this.diceTurnAnimateCont = diceTurnAnimateCont;
                this.diceSideExternals = diceSideExternals;
                this.diceSideLightColor = diceSideLightColor;
            }
            
            allowStopControl = true;
            stopVelocity = 0.6;
            celeration = - 0.0020;
            private Vmax = 5;
            minTurnReboundVelocity= 1.5;
            private stopDegreesTolerance = 5;
            private velocityVector = { x: 0, y: 0 };
            private decelerationFuncMin = this.stopVelocity / this.Vmax;
            motionDuration = 0;
            oneTurnDuration = 0;
            ti = 0;
            isReboundLeft = false;
            isReboundRight = false;
            isReboundTop = false;
            isReboundBottom = false;
            bordersReboundcontrolInitStart = false;
            animationFrameId = null;
                                                                                
            setVelocityVector = (x: number, y: number) => {
                this.velocityVector.x = x;
                this.velocityVector.y = y;
            }

            decelerationFunc = (t: number): number => {                              
                const result = ((- 1 / this.motionDuration) * t) + 1;
                return result > this.decelerationFuncMin ? result : this.decelerationFuncMin * 0.8;
            }
                     
            allowPlayBackRateUpdateStart = true;
            playBackRateUpdate = () => {
                const t = Date.now() - this.ti;
                if (this.diceTurnAnimation && this.diceMoveAnimation) {
                    this.diceTurnAnimation.playbackRate = this.decelerationFunc(t);
                    this.diceMoveAnimation.playbackRate = this.decelerationFunc(t);
                }
                requestAnimationFrame(this.playBackRateUpdate)
            }    

            playBackRateUpdateInit = () => {
                this.ti = Date.now();    
                if (this.allowPlayBackRateUpdateStart) {
                    this.allowPlayBackRateUpdateStart = false;
                    this.playBackRateUpdate();
                }
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

            getCloseAxis = (rot: number) => {               //Calcula cual es el angulo mas cercano al que tiene que estar girado el dado para verse "Apoyado" en el plano
                let currentYRotation = rot;
                let angle_decimal = (currentYRotation / 90) % 1;
                let angle_int = (currentYRotation / 90) - angle_decimal
                if (Math.abs(angle_decimal) > 0.5) {
                    angle_decimal = angle_decimal > 0 ? Math.ceil(angle_decimal) : Math.floor(angle_decimal);
                } else {
                    angle_decimal = angle_decimal > 0 ? Math.floor(angle_decimal) : Math.ceil(angle_decimal);
                }
                const closeAxis = (angle_int + angle_decimal) * 90;
                return closeAxis;
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

            setdiceTurnAnimation = (currentYRotation: number) => {       /* Animacion de rotacion del dado */
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

            setdiceMoveAnimation = (Vx: number, Vy: number) => {      /* Animacion de translacion del dado */
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
           
            stopControlInitStart = false;
            stopControlInit = () => {
                const stopControl = () => {
                    if (this.getVelocity() < this.stopVelocity && this.allowStopControl) {
                        const actualYrotation = this.getCurrentYRotation();
                        if (
                            (actualYrotation < this.stopDegreesTolerance && actualYrotation > -this.stopDegreesTolerance) || 
                            (actualYrotation < (90 + this.stopDegreesTolerance) && actualYrotation > (90 - this.stopDegreesTolerance)) ||
                            (actualYrotation < (-180 + this.stopDegreesTolerance) && actualYrotation > (180 - this.stopDegreesTolerance)) ||
                            (actualYrotation < (-90 + this.stopDegreesTolerance) && actualYrotation > (-90 - this.stopDegreesTolerance))
                        ) {
                            this.diceTurnAnimation?.pause();
                            this.diceMoveAnimation?.pause();
                        }
                    }
                    requestAnimationFrame(stopControl);
                }
                requestAnimationFrame(stopControl);
            }
                        
            bordersReboundcontrolInit = () => {

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

                /***************************************** Generacion de colores a partir del ingresado al instanciar las clases ************************************/

                const colorHex = this.color;                                            
                const redHex = colorHex.slice(1, 3);
                const greenHex = colorHex.slice(3, 5);
                const blueHex = colorHex.slice(5, 7);
                                
                const red10 = parseInt(redHex, 16);
                const green10 = parseInt(greenHex, 16);
                const blue10 = parseInt(blueHex, 16);
                                
                const newRed10 = red10 + 40 > 255 ? 255 : red10 + 40;
                const newGreen10 = green10 + 40 > 255 ? 255 : green10 + 40;
                const newBlue10 = blue10 + 40 > 255 ? 255 : blue10 + 40;
                const newOpac10 = 128;

                const newRedHex = newRed10.toString(16);
                const newGreenHex = newGreen10.toString(16);
                const newBlueHex = newBlue10.toString(16);
                const newOpacHex = newOpac10.toString(16);
                
                const lightColor: {[key: string]: any} = {
                    red: red10,
                    green: green10,
                    blue: blue10,
                }

                let maxKey = "";
                for (const key in lightColor) {
                    if (lightColor[key] > maxKey) {
                        maxKey = key;
                    }
                }

                const originalColor: {[key: string]: any} = {   
                    red: redHex,
                    green: greenHex,
                    blue: blueHex,
                }

                const lightColorHex: {[key: string]: any} = {
                    red: newRedHex,
                    green: newGreenHex,
                    blue: newBlueHex,
                    opac: newOpacHex
                }

                lightColorHex[maxKey] = originalColor[maxKey];

                const finalLightColor = `#${lightColorHex.red}${lightColorHex.green}${lightColorHex.blue}`;
                const finalColorShadow = `#${lightColorHex.red}${lightColorHex.green}${lightColorHex.blue}${lightColorHex.opac}`;
                
                this.diceSideExternals?.forEach((side) => {
                    side.style.backgroundColor = this.color;
                    side.style.border = `2px solid ${finalLightColor}`;
                    side.style.boxShadow = `0px 0px 20px 0px ${finalColorShadow}`;
                })
                this.diceSideLightColor?.forEach((side) => {
                    side.style.backgroundColor = finalLightColor;
                })

                /**********************************************************************************************************************************************************/
                               
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
                            this.setdiceTurnAnimation(this.getCurrentYRotation());
                            this.setdiceMoveAnimation(Vxi, Vyi);
                            this.bordersReboundcontrolInit();
                            this.bordersReboundcontrolInitStart = true;
                            this.stopControlInit(); 
                            this.stopControlInitStart = true;
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
                   
            const getCentersDistance = () => {
                const xDistance = Math.abs(dice0.getPosition().x - dice1.getPosition().x);
                const yDistance = Math.abs(dice0.getPosition().y - dice1.getPosition().y);
                return Math.sqrt((xDistance ** 2) + (yDistance ** 2));
            }

            const isCollision = (): boolean => {                        

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

                let xDistance = 0;
                if (dice0limitRight < dice1limitLeft) {
                    xDistance = dice1limitLeft - dice0limitRight
                } else if (dice0limitLeft > dice1limitRight) {
                    xDistance = dice0limitLeft - dice1limitRight
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

                let yDistance = 0;
                if (dice0limitBottom < dice1limitTop) {
                    yDistance = dice1limitTop - dice0limitBottom
                } else if (dice0limitTop > dice1limitBottom) {
                    yDistance = dice0limitTop - dice1limitBottom
                }
                
                return xDistance <= 0 && yDistance <= 0 && getCentersDistance() <= dice0.diceSize * 1.25 ? true : false;
            }

            let allowCollisionControl = true;
            let allowDistanceControl = false
            let dice0newVx: number = 0;
            let dice0newVy: number = 0;
            let dice1newVx: number = 0;
            let dice1newVy: number = 0;
            const lostCollisionVelocity = 0.2;
            const lostCossisionVelCoef = 1 - lostCollisionVelocity;

            const impactController = () => {
                                                          
                if (allowDistanceControl && getCentersDistance() > dice0.diceSize * 1.25) {
                    allowCollisionControl = true;
                    allowDistanceControl = false;
                }
                
                if (isCollision() && allowCollisionControl) {
                                    
                    dice0.diceMoveAnimation?.pause();
                    dice1.diceMoveAnimation?.pause();
                    dice0.diceTurnAnimation?.pause();
                    dice1.diceTurnAnimation?.pause();

                    const dice0Vx = dice0.getVelocityVector().x;
                    const dice0Vy = dice0.getVelocityVector().y;
                    const dice1Vx = dice1.getVelocityVector().x;
                    const dice1Vy = dice1.getVelocityVector().y;

                    const dice0Pos = dice0.getPosition();
                    const dice1Pos = dice1.getPosition();

                    let dice0CurrentYRotation = dice0.getCurrentYRotation();
                    let dice1CurrentYRotation = dice1.getCurrentYRotation();   

                    dice0newVx = dice1Vx * lostCossisionVelCoef;    //Al chocar entre si los dados pierden un porcentaje de su velocidad dado por el termino "lostCossisionVelCoef"
                    dice0newVy = dice1Vy * lostCossisionVelCoef;    //Al chocar entre si los dados se intrecambian sus velocidades
                    dice1newVx = dice0Vx * lostCossisionVelCoef; 
                    dice1newVy = dice0Vy * lostCossisionVelCoef;
                    allowDistanceControl = true;                    //Habilitamos "allowDistanceControl" para controldar que los dados se separen los fuciciente luedo de chocarse, para uqe no queden "pegados" 
                    allowCollisionControl = false;                  //Deshabilitamos el control de colision hasta que los dados se separen lo suficiente
                                     
                    dice0CurrentYRotation = dice0.getCloseAxis(dice0CurrentYRotation);      //Al rebotar entre si los dados comienzan girando desde su angulo de giro mas cercana donde se ven "apoyados" en el plano
                    dice1CurrentYRotation = dice1.getCloseAxis(dice1CurrentYRotation);
                                                                                                 
                    let dice0newV = Math.sqrt((dice0newVx ** 2) + (dice0newVy ** 2));
                    let dice1newV = Math.sqrt((dice1newVx ** 2) + (dice1newVy ** 2));
    
                    dice0.oneTurnDuration = (4 * dice0.diceSize) / dice0newV;
                    dice1.oneTurnDuration = (4 * dice1.diceSize) / dice1newV;
                
                    dice0.setPosition(dice0Pos.x, dice0Pos.y);
                    dice1.setPosition(dice1Pos.x, dice1Pos.y);

                    dice0.setVelocityVector(dice0newVx, dice0newVy);
                    dice1.setVelocityVector(dice1newVx, dice1newVy);

                    dice0.motionDuration = Math.abs((dice0.stopVelocity - dice0newV) / (dice0.celeration));     // At = Av / a
                    dice1.motionDuration = Math.abs((dice1.stopVelocity - dice1newV) / (dice1.celeration));

                    dice0.diceMoveAnimation?.cancel();
                    dice1.diceMoveAnimation?.cancel();
                    dice0.diceTurnAnimation?.cancel();
                    dice1.diceTurnAnimation?.cancel();
                    document.body.getAnimations({subtree: true}).forEach((animation) => {
                        animation.cancel();
                    })

                    dice0.setdiceMoveAnimation(dice0newVx, dice0newVy);
                    dice1.setdiceMoveAnimation(dice1newVx, dice1newVy);
                    dice0.setdiceTurnAnimation(dice0CurrentYRotation);
                    dice1.setdiceTurnAnimation(dice1CurrentYRotation);

                    if(!dice0.bordersReboundcontrolInitStart) {             //Si ya llamamos a la funcion "bordersReboundcontrolInit()"" no volvemos a llamarla
                        dice0.bordersReboundcontrolInit();
                        dice0.bordersReboundcontrolInitStart = true;
                    } else {
                        dice0.isReboundLeft = false;                        //Luego de un choque entre dados habilitamos el rebote en cualquier banda
                        dice0.isReboundRight = false;
                        dice0.isReboundTop = false;
                        dice0.isReboundBottom = false;
                    }
                    if(!dice1.bordersReboundcontrolInitStart) {
                        dice1.bordersReboundcontrolInit();
                        dice1.bordersReboundcontrolInitStart = true;
                    } else {
                        dice1.isReboundLeft = false;
                        dice1.isReboundRight = false;
                        dice1.isReboundTop = false;
                        dice1.isReboundBottom = false;
                    }
                                       
                    if (!dice0.stopControlInitStart) {                      //Si ya llamamos a la funcion "stopControlInit()" no volvemos a llamarla
                        dice0.stopControlInit();
                        dice0.stopControlInitStart = true;
                    }
                    if (!dice1.stopControlInitStart) {
                        dice1.stopControlInit();
                        dice1.stopControlInitStart = true;
                    }
           
                    dice0.playBackRateUpdateInit();                         //Luego de cada rebote se reinicia la actualizacion del "playbakcrate" de las animaciones de cada dado
                    dice1.playBackRateUpdateInit();
                      
                    if (dice0.getVelocity() < dice0.minTurnReboundVelocity && dice1.getVelocity() < dice1.minTurnReboundVelocity) {         //Si ambos dados REBOTAN a una velocidad menor que
                        dice0.allowStopControl = false;                                                                                     // "minTurnReboundVelocity" no giran al rebotar        
                        dice0.diceTurnAnimation?.pause();                                                                                   // y se mueven una distancia igual a:
                        setTimeout(() => {                                                                                                  // "dice1.diceSize / 2" (valor arbitrario)
                            dice0.diceMoveAnimation?.pause()
                            dice0.allowStopControl = true;
                        }, (dice0.diceSize / 2) / dice0.stopVelocity);                                                                      

                        dice1.allowStopControl = false;
                        dice1.diceTurnAnimation?.pause();
                        setTimeout(() => {
                            dice1.diceMoveAnimation?.pause()
                            dice1.allowStopControl = true;
                        }, (dice1.diceSize / 2) / dice1.stopVelocity);
                    }

                    if (dice1.getVelocity() < dice1.stopVelocity && dice0.getVelocity() > dice0.stopVelocity) {     //Si al chocar entre si alguno de los dados SALE moviendose a menos de
                        dice1.diceMoveAnimation?.pause()                                                            // "stopVelocity" lo detenemos
                        dice1.diceTurnAnimation?.pause();
                    } else if (dice0.getVelocity() < dice0.stopVelocity && dice1.getVelocity() > dice1.stopVelocity) {
                        dice0.diceMoveAnimation?.pause()
                        dice0.diceTurnAnimation?.pause();
                    }
                }
                requestAnimationFrame(impactController);
            }
            requestAnimationFrame(impactController);
        }

        const dice0 = new Dice(0, 960, 500, "#e9759c");
        const dice1 = new Dice(1, 1500, 500, "#6ec2b0");

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