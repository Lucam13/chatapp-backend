import Area from '../models/area.model.js';

export const createArea = async (req, res) => {
    const { name, description } = req.body;
    try {
        const area = await Area.create({ name, description });
        res.status(201).json(area);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export const getAreas = async (req, res) => {
    try {
        const areas = await Area.find()
        .populate('username')
        res.status(200).json(areas);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

export const getAreasForSidebar = async (req, res) => {
    try {
      const loggedInArea = req.user.area;
  
      const filteredAreas = await Area.find({ _id: { $ne: loggedInArea } }).populate("user_id",'username');
      
      res.status(200).json(filteredAreas);
    } catch (error) {
      console.log("Error in getAreasForSidebar controller", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  
