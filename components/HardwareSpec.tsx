
import React from 'react';

const hardware = [
    {
        category: 'LATEST: Blackwell Ultra',
        name: 'NVIDIA B300 GPU',
        description: 'Blackwell Ultra B300 GPU delivers the highest single-GPU AI performance with 288GB HBM3e memory, 12 TB/s bandwidth, and 2nd-gen Transformer Engine.',
        imageUrl: '/nvidia-blackwell-ultra.jpg',
        stats: [
            { value: '288 GB', label: 'HBM3e Memory' },
            { value: '12 TB/s', label: 'Memory Bandwidth' },
            { value: '~$5.99', label: '/GPU-hr Cloud' },
            { value: 'Blackwell Ultra', label: 'Architecture' },
            { value: '1800 GB/s', label: 'NVLink 5.0' },
            { value: '2nd Gen', label: 'Transformer Engine' },
        ]
    },
    {
        category: 'Rack-Scale: Blackwell Architecture',
        name: 'NVIDIA GB200 NVL72',
        description: 'Rack-scale system with 8x B200 GPUs and 2x Grace CPUs. 1.4 EXAFLOPS FP4 performance with 1,536GB total HBM3e memory and direct liquid cooling.',
        imageUrl: '/nvidia-blackwell-ultra.jpg',
        stats: [
            { value: '1,536 GB', label: 'Total HBM3e' },
            { value: '1.4 EX', label: 'FLOPS FP4' },
            { value: '8x B200', label: '+ 2x Grace' },
            { value: 'From $399K', label: 'Purchase' },
            { value: '$29,999', label: '/mo Lease' },
            { value: 'Liquid', label: 'Cooled' },
        ]
    },
    {
        category: 'Blackwell Architecture',
        name: 'NVIDIA B200 GPU',
        description: 'The Blackwell B200 GPU delivers exceptional AI performance with 192GB HBM3e memory and 2nd-gen Transformer Engine for next-generation AI workloads.',
        imageUrl: '/nvidia-blackwell-ultra.jpg',
        stats: [
            { value: '192 GB', label: 'HBM3e Memory' },
            { value: '8 TB/s', label: 'Memory Bandwidth' },
            { value: '9 PFLOPS', label: 'FP4 AI Performance' },
            { value: 'Blackwell', label: 'Architecture' },
            { value: '1800 GB/s', label: 'NVLink 5.0' },
            { value: '2nd Gen', label: 'Transformer Engine' },
        ]
    },
    {
        category: 'Blackwell Architecture',
        name: 'NVIDIA B100 GPU',
        description: 'Blackwell B100 GPU combines exceptional AI performance with 192GB memory, perfect for training and inference of the largest AI models.',
        imageUrl: '/nvidia-dgx-spark-and-dgx-station.jpg',
        stats: [
            { value: '192 GB', label: 'HBM3e Memory' },
            { value: '8 TB/s', label: 'Memory Bandwidth' },
            { value: '7 PFLOPS', label: 'FP4 AI Performance' },
            { value: 'Blackwell', label: 'Architecture' },
            { value: '1800 GB/s', label: 'NVLink 5.0' },
            { value: 'PCIe Gen6', label: 'System Interface' },
        ]
    },
    {
        category: 'Hopper Architecture',
        name: 'NVIDIA H200 GPU',
        description: 'The H200 offers HBM3e with 141GB of memory at 4.8 terabytes per second to handle massive datasets for generative AI and HPC.',
        imageUrl: '/h200-nvl.jpg',
        stats: [
            { value: '141 GB', label: 'HBM3e Memory' },
            { value: '4.8 TB/s', label: 'Memory Bandwidth' },
            { value: '97 TFLOPS', label: 'FP64 Performance' },
            { value: '4 PFLOPS', label: 'FP8 AI Performance' },
            { value: 'Hopper', label: 'Architecture' },
            { value: '900 GB/s', label: 'NVLink C2C' },
        ]
    },
    {
        category: 'Hopper Architecture',
        name: 'NVIDIA H100 GPU',
        description: 'The NVIDIA H100 Tensor Core GPU delivers exceptional performance, scalability, and security for data centers, accelerating workloads from enterprise AI to HPC.',
        imageUrl: '/nvidia-dgx-spark-and-dgx-station.jpg',
        stats: [
            { value: '80 GB', label: 'HBM3 Memory' },
            { value: '3.35 TB/s', label: 'Memory Bandwidth' },
            { value: '67 TFLOPS', label: 'FP64 Performance' },
            { value: '2 PFLOPS', label: 'FP8 AI Performance' },
            { value: 'Hopper', label: 'Architecture' },
            { value: 'PCIe Gen5', label: 'System Interface' },
        ]
    },
    {
        category: 'COMING 2027: Vera Rubin Architecture',
        name: 'NVIDIA R-Series (Vera Rubin)',
        description: 'Next-generation Vera Rubin architecture GPUs are expected in 2027. Contact us to join the waitlist for early access when available.',
        imageUrl: '/nvidia-dgx-spark-and-dgx-station.jpg',
        stats: [
            { value: 'R-Series', label: 'Architecture' },
            { value: '2027', label: 'Expected' },
            { value: 'HBM4', label: 'Memory Type' },
            { value: 'Next Gen', label: 'NVLink' },
            { value: 'TBD', label: 'Performance' },
            { value: 'Waitlist', label: 'Status' },
        ]
    },
];

const Stat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
    <div className="text-center">
        <p className="text-2xl md:text-3xl font-bold text-primary">{value}</p>
        <p className="text-gray-400 text-sm mt-1">{label}</p>
    </div>
);

const HardwareCard: React.FC<{ item: typeof hardware[0], onSelectProduct: (name: string) => void }> = ({ item, onSelectProduct }) => (
    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden flex flex-col">
        <div className="bg-black p-4">
            <img src={item.imageUrl} alt={item.name} className="w-full h-80 object-contain aspect-video" />
        </div>
        <div className="p-8 flex-grow flex flex-col">
            <span className="text-primary font-bold uppercase tracking-widest text-sm">{item.category}</span>
            <h3 className="text-3xl font-bold text-white mt-2 mb-4">{item.name}</h3>
            <p className="text-gray-400 mb-6 flex-grow">{item.description}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 border-t border-dark-border">
                {item.stats.map(stat => <Stat key={stat.label} {...stat} />)}
            </div>
            <div className="mt-8">
                <button 
                  onClick={() => onSelectProduct(item.name)} 
                  className="w-full bg-primary text-black font-bold py-3 px-6 rounded-lg hover:bg-primary-dark transition-all duration-300 transform hover:scale-105"
                >
                  Request Access
                </button>
            </div>
        </div>
    </div>
);


const HardwareSpec: React.FC<{ onSelectProduct: (name: string) => void }> = ({ onSelectProduct }) => {
  return (
    <section id="hardware" className="py-20 md:py-28 bg-dark-bg">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white">Explore Our Hardware Fleet</h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">Access the most powerful and sought-after AI accelerators on the market.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 max-w-6xl mx-auto">
            {hardware.map(item => <HardwareCard key={item.name} item={item} onSelectProduct={onSelectProduct} />)}
        </div>
      </div>
    </section>
  );
};

export default HardwareSpec;