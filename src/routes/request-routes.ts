import { Request, Response } from "express";

import { isRequestValid } from "../util/methods";
import { RequestModel, addNewRequest, findRequestById, updateRequestStatus } from "../db/requests";
import { findUserById, updateAcountType } from "../db/users";
type ReqRequest = {
  acountName: string;
  acountId: string;
  city:string;
};
type AccountUpgradeRequest ={
    townHallAccountId: string,
    requestId: string,
}
export const addRequest = async (req: Request, res: Response) => {
  const requestRequest: ReqRequest = {
    acountName: req.body.acountName,
    acountId: req.body.acountId,
    city:req.body.city,
  };
  if (!isRequestValid(requestRequest)) {
    res
      .status(400)
      .send("Request object does not have all the correct properties");
    return;
  }
  const data = new Date();
  const requestToAdd: RequestModel = {
    ...requestRequest,
    date: data.getTime(),
    status: "PENDING",
  };
  await addNewRequest(requestToAdd);
  res.send("Request added succesfully");
};
export const accountUpgradeRequestAction = async (
    req: Request,
    res: Response,
    mode: "accept" | "reject"
  ) => {
    const acceptUpgradeRequest: AccountUpgradeRequest = {
      townHallAccountId: req.body.townHallAccountId,
      requestId: req.body.requestId,
    };
  
    if (!isRequestValid(acceptUpgradeRequest)) {
      res
        .status(400)
        .send("Request object does not have all the correct properties");
      return;
    }
  
    const curUpgradeRequest = await findRequestById(
      acceptUpgradeRequest.requestId
    );
    if (!curUpgradeRequest) {
      res.status(400).send("Upgrade request does not exist");
      return;
    }
  
    const accountToUpgrade = await findUserById(curUpgradeRequest.id);
    if (!accountToUpgrade) {
      res.status(400).send("Account to upgrade does not exist");
      return;
    }
  
    const townHallAccount = await findUserById(
      acceptUpgradeRequest.townHallAccountId
    );
    if (
      !townHallAccount ||
     
      townHallAccount.oras !== curUpgradeRequest.city
    ) {
      res
        .status(400)
        .send("Account id is wrong or the account is managing another town hall");
      return;
    }
  
    if (mode === "accept") {
      await updateAcountType(curUpgradeRequest.id);
      await updateRequestStatus(
        curUpgradeRequest._id.toString(),
        "ACCEPTED"
      );
      res.send("Request accepted succesfully");
    } else {
      await updateRequestStatus(
        curUpgradeRequest._id.toString(),
        "REJECTED"
      );
      res.send("Request rejected succesfully");
    }
  };