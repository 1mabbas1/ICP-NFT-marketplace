import React, {useEffect, useState} from "react";
import {Actor, HttpAgent} from "@dfinity/agent";
import {idlFactory} from "../../../declarations/nft";
import {Principal} from "@dfinity/principal"
import Button from "./Button";
import { opend } from "../../../declarations/opend/index";

function Item(props) {

  const [name, setname] = useState();
  const [owner, setowner] = useState();
  const [image, setimage] = useState();
  const [button, setButton] = useState();
  const [priceInput, setPriceInput] = useState()
  const [loaderHidden, setLoaderHidden] = useState(true)

  const id= props.id;

  const localHost = "http://localhost:8080";
  const agent = new HttpAgent({host: localHost});

  //Remove the following line when deploying live to ICP
  agent.fetchRootKey();
  let NFTActor;

  async function loadNFT () {
   NFTActor = await Actor.createActor(idlFactory, {agent, canisterId: id});

   const name = await NFTActor.getName();
   const owner = await NFTActor.getOwner();
   const imagedata = await NFTActor.getAsset();
   const imageContent = new Uint8Array(imagedata);
   const image=  URL.createObjectURL(new Blob([imageContent.buffer], {type: "image/png"}) )

   setname(name);
   setowner(owner.toText());
   setimage(image)

   setButton(<Button handleClick = {handleSell} text = {"Sell"}/>)
  }

  useEffect(() => {loadNFT()}, []);

  let price;
  function handleSell() {
    console.log("Sell")
    setPriceInput(<input
        placeholder="Enter Price"
        type="number"
        className="price-input"
        value={price}
        onChange={(e)=> price=e.target.value}
      />)

      setButton(<Button handleClick={sellItem} text={"Confirm"} />)
      
  }
  
  async function sellItem() {
    setLoaderHidden(false)
    const listingResult = await opend.listItem(props.id, Number(price));
    console.log(listingResult)
    if (listingResult == "Success!"){
      const opendId = await opend.getOpendId();
      const transferResult =  await NFTActor.transferOwnership(opendId)
      console.log("Transfer Result: " + transferResult)
    } else {
      console.log("BIGERROR")
    }
    setLoaderHidden(true)
  }

  return (
    <div className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={image}
        />
        <div className="lds-ellipsis" hidden = {loaderHidden} >
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
        <div className="disCardContent-root">
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}<span className="purple-text"></span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: {owner}
          </p>
          {priceInput}
          {button}
        </div>
      </div>
    </div>
  );
}

export default Item;
