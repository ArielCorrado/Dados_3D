import "./home.css";
import Dice2 from "../../components/dice2/Dice2";
import { useState, useEffect } from "react";

function Home() {

    const [dice, setDice] = useState <JSX.Element> (<></>);

    
    useEffect(() => {
                
        setDice (
        <>
            <Dice2 number={0} xPos={200} yPos={500}/>
            <Dice2 number={1} xPos={600} yPos={500}/>
        </>);
                
    }, [])
    
   
    return (
        <div className="seccion rubikSeccion flex">
            {dice}
        </div>
    )
}

export default Home