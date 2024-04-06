import Bank from "../models/bankMaster.js";
import RTO from "../models/rto.js";
import service from "../models/serviceData.js";


export const fetchBanks = async (req, res) => {
   console.log('fetching banks')
   try {
      const allbanks = await Bank.find({})
      res.status(500).json({ allbanks });

   } catch (error) {
      console.log(error)
      res.status(500).json({ message: 'Error fetching banks', error: error.message });

   }

}

export const fetchRto = async (req, res) => {
   try {
      const allbanks = await RTO.find({})
      res.status(500).json({ allbanks });

   } catch (error) {
      console.log(error)
      res.status(500).json({ message: 'Error fetching rtos', error: error.message });

   }
}

export const fetchService = async (req, res) => {
   try {
      const allbanks = await service.find({})
      res.status(500).json({ allbanks });

   } catch (error) {
      console.log(error)
      res.status(500).json({ message: 'Error fetching services', error: error.message });

   }

}

