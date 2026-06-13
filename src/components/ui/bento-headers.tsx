import { motion } from "motion/react";
import { Search, Tractor, MessageSquare, Clock, ClipboardList, MapPin, Globe, User } from "lucide-react";

export const SearchHeader = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 relative overflow-hidden flex items-center justify-center">
      <motion.div
        animate={{ x: [-20, 20, -20] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 text-blue-600"
      >
        <Search size={48} strokeWidth={1.5} />
      </motion.div>
      <div className="absolute flex gap-8 opacity-20 text-blue-800">
        <User size={32} />
        <User size={32} />
        <User size={32} />
      </div>
    </div>
  );
};

export const TractorHeader = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-green-100 to-green-50 relative overflow-hidden flex items-center justify-center">
      <motion.div
        animate={{ x: [-40, 40], y: [0, -2, 0, -2, 0] }}
        transition={{ 
          x: { duration: 4, repeat: Infinity, ease: "linear" },
          y: { duration: 0.5, repeat: Infinity, ease: "linear" }
        }}
        className="text-green-700"
      >
        <Tractor size={56} strokeWidth={1.5} />
      </motion.div>
    </div>
  );
};

export const ChatHeader = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 relative overflow-hidden flex items-center justify-center gap-4">
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-purple-600 mt-4"
      >
        <MessageSquare size={40} strokeWidth={1.5} />
      </motion.div>
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="text-purple-500 mb-4"
      >
        <MessageSquare size={40} strokeWidth={1.5} />
      </motion.div>
    </div>
  );
};

export const TrackingHeader = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 relative overflow-hidden flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="text-orange-600"
      >
        <Clock size={48} strokeWidth={1.5} />
      </motion.div>
    </div>
  );
};

export const BoardHeader = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-teal-100 to-teal-50 relative overflow-hidden flex items-center justify-center">
      <motion.div
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="text-teal-600"
      >
        <ClipboardList size={48} strokeWidth={1.5} />
      </motion.div>
    </div>
  );
};

export const LocationHeader = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-red-100 to-red-50 relative overflow-hidden flex items-center justify-center">
      <div className="relative flex items-center justify-center mt-2">
        <motion.div
          animate={{ y: [-15, 0, -15] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-red-600 relative z-10"
        >
          <MapPin size={48} strokeWidth={1.5} />
        </motion.div>
        <motion.div
          animate={{ scale: [0.5, 2], opacity: [0.8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          className="absolute bottom-[-10px] w-8 h-3 bg-red-400 rounded-[50%]"
        />
      </div>
    </div>
  );
};

export const GlobeHeader = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 relative overflow-hidden flex items-center justify-center">
      <motion.div
        animate={{ rotateY: [0, 360] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="text-indigo-600"
        style={{ perspective: "1000px" }}
      >
        <Globe size={48} strokeWidth={1.5} />
      </motion.div>
    </div>
  );
};
