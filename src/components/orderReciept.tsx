import { useState } from "react";
import { Handle } from "@xyflow/react";

const OrderReciept = ({data}) => {
    const [reciept, setReciept] = useState([]);


return(
    <div className="p-4 bg-white border border-gray-300 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold">Reciept</h3>  

      <Handle type="target" position="top" id="step1" />    
      </div>

);
};

export{OrderReciept};