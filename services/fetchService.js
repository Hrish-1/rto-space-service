import Bank from "../models/bankMaster.js";
import partnerMaster from "../models/partnerMaster.js";
import RTO from "../models/rto.js";
import service from "../models/serviceData.js";


export const fetchBanks = async (req, res) => {
   console.log('fetching banks')
   try {
      const banks = await Bank.find({})
      res.status(200).json(banks);

   } catch (error) {
      console.log(error)
      res.status(500).json({ message: 'Error fetching banks', error: error.message });

   }

}

export const fetchRto = async (req, res) => {
   try {
      const rtos = await RTO.find({})
      res.status(200).json(rtos);

   } catch (error) {
      console.log(error)
      res.status(500).json({ message: 'Error fetching rtos', error: error.message });

   }
}

export const fetchService = async (req, res) => {
   try {
      const services = await service.find({})
      res.status(200).json(services);

   } catch (error) {
      console.log(error)
      res.status(500).json({ message: 'Error fetching services', error: error.message });
   }

}

export const fetchCustomers = async (req, res) => {
   try {
      const customers = await partnerMaster.find({})
      res.status(200).json(customers);

   } catch (error) {
      console.log(error)
      res.status(500).json({ message: 'Error fetching services', error: error.message });
   }
}

