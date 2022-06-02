import React, {useEffect, useState} from "react";
import {Actor, HttpAgent} from "@dfinity/agent";
import {idlFactory} from "../../../declarations/nft";
import {Principal} from "@dfinity/principal"
import Button from "./Button";
import { opend } from "../../../declarations/opend/index";
import PriceLabel from "./PriceLabel";
import CURRENT_USER_ID from "../index";


function Item(props) {

  const [name, setname] = useState();
  const [owner, setOwner] = useState();
  const [image, setimage] = useState();
  const [button, setButton] = useState();
  const [priceInput, setPriceInput] = useState();
  const [loaderHidden, setLoaderHidden] = useState(true);
  const [blur, setBlur] = useState();
  const [sellStatus, setSellStatus] = useState("");  
  const [priceLabel, setPriceLabel] = useState();


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
   setOwner(owner.toText());
   setimage(image)


    if (props.role == "collection") {
      const nftIsListed = await opend.isListed(props.id);

      if (nftIsListed) {
        setOwner("OpenD");
        setBlur({ filter: "blur(4px)" });
        setSellStatus("Listed");
      } else {
        setButton(<Button handleClick={handleSell} text={"Sell"} />);
      }
    } else if (props.role == "discover") {
      const originalOwner = await opend.getOriginalOwner(props.id);
      if (originalOwner.toText() != CURRENT_USER_ID.toText()) {
        setButton(<Button handleClick={handleBuy} text={"Buy"} />);
      }

      const price = await opend.getListedNFTPrice(props.id);
      setPriceLabel(<PriceLabel sellPrice={price.toString()} />);
    }
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

  async function handleBuy(){
    console.log("buy")
  }
  
  async function sellItem() {
    setBlur({filter: "blur(4px)"});
    setLoaderHidden(false)
    const listingResult = await opend.listItem(props.id, Number(price));
    console.log(listingResult)
    if (listingResult == "Success!"){
      const opendId = await opend.getOpendId();
      const transferResult =  await NFTActor.transferOwnership(opendId);
      console.log("Transfer Result: " + transferResult);
      if (transferResult == "Success" ) {
        setLoaderHidden(true);
        setButton();
        setPriceInput();
        setwner("OpenD");
        setSellStatus("Listed");
      }
    } else {
      console.log("BIGERROR");
    }
    setLoaderHidden(true);
  }

  
  async function handleBuy() {
    console.log("Buy was triggered");
  }


  return (
    <div className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={image}
          style={blur}
        />
        <div className="lds-ellipsis" hidden={loaderHidden}>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className="disCardContent-root">
          {priceLabel}
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}
            <span className="purple-text"> {sellStatus}</span>
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
