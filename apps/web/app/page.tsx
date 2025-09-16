
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/ui/layout';
import { ActionCard } from '@/components/ui/action-card';
import { useRouter } from 'next/navigation';
import {
  Phone,
  Headphones,
  UserCheck,
  Users,
  ArrowRight,
  Zap,
  Shield,
  Globe
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const roles = [
    {
      id: 'caller',
      title: 'Customer (Caller)',
      description: 'Experience the customer journey - get support and potentially be transferred to a phone specialist',
      icon: <UserCheck className="h-8 w-8 text-blue-600" />,
      path: '/caller',
      color: 'blue',
      features: [
        'Browser-based audio call',
        'LiveKit integration',
        'Seamless phone transfer',
        'No phone number required'
      ]
    },
    {
      id: 'agent-a',
      title: 'Agent A (Support Agent)',
      description: 'Handle customer inquiries and perform warm transfers to phone specialists when needed',
      icon: <Headphones className="h-8 w-8 text-green-600" />,
      path: '/agent-a',
      color: 'green',
      features: [
        'Customer support interface',
        'Twilio phone integration',
        'Warm transfer controls',
        'Conference management'
      ]
    },
    {
      id: 'agent-b',
      title: 'Agent B (Phone Specialist)',
      description: 'Join as the phone specialist who receives transferred calls from support agents',
      icon: <Phone className="h-8 w-8 text-purple-600" />,
      path: '/agent-b',
      color: 'purple',
      features: [
        'Phone-based participation',
        'Specialist expertise',
        'Warm handoff reception',
        'Traditional phone system'
      ]
    }
  ];

  const handleRoleSelect = (path: string) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-800 mb-6">
            Warm Transfer
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Demo</span>
          </h1>

          {/* Feature Highlights */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm rounded-full px-4 py-2 border border-blue-100">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Real-time Audio</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm rounded-full px-4 py-2 border border-green-100">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-slate-700">Secure Connection</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm rounded-full px-4 py-2 border border-purple-100">
              <Globe className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-slate-700">Browser + Phone</span>
            </div>
          </div>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {roles.map((role) => (
            <div
              key={role.id}
              className={`relative transform transition-all duration-300 ${hoveredCard === role.id ? 'scale-105 -translate-y-2' : ''
                }`}
              onMouseEnter={() => setHoveredCard(role.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <ActionCard
                title={role.title}
                description={role.description}
                icon={role.icon}
                variant={role.color === 'blue' ? 'info' : role.color === 'green' ? 'success' : 'default'}
              >
                <div className="space-y-4">
                  {/* Features List */}
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-slate-100">
                    <h4 className="font-semibold text-slate-800 mb-3 text-sm">Key Features:</h4>
                    <ul className="space-y-2">
                      {role.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-slate-600">
                          <div className={`w-1.5 h-1.5 rounded-full mr-3 ${role.color === 'blue' ? 'bg-blue-500' :
                              role.color === 'green' ? 'bg-green-500' : 'bg-purple-500'
                            }`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => handleRoleSelect(role.path)}
                    className={`w-full h-12 text-base font-medium transition-all duration-200 ${role.color === 'blue'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                        role.color === 'green'
                          ? 'bg-green-600 hover:bg-green-700 text-white' :
                          'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                  >
                    Enter as {role.title.split(' ')[0]}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </ActionCard>
            </div>
          ))}
        </div>

        {/* Demo Flow Explanation */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-slate-200 shadow-xl">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">How the Demo Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <span className="text-blue-600 font-bold text-lg">1</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Customer Connects</h3>
              <p className="text-sm text-slate-600">
                Customer opens browser, joins support room, and speaks with Agent A via LiveKit
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <span className="text-green-600 font-bold text-lg">2</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Warm Transfer</h3>
              <p className="text-sm text-slate-600">
                Agent A calls phone specialist, briefs them, then adds customer to Twilio conference
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                <span className="text-purple-600 font-bold text-lg">3</span>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Specialist Assists</h3>
              <p className="text-sm text-slate-600">
                Customer (browser) connects directly with phone specialist for specialized support
              </p>
            </div>
          </div>
        </div>

        {/* Technical Stack Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500 mb-4">
            Powered by <strong>LiveKit</strong> for browser audio, <strong>Twilio Voice</strong> for phone integration,
            and <strong>FastAPI</strong> for real-time coordination
          </p>
          <div className="flex justify-center space-x-6 text-xs text-slate-400">
            <span>🎧 WebRTC Audio</span>
            <span>📞 Phone Integration</span>
            <span>🔄 Real-time Signaling</span>
            <span>🛡️ Secure Connections</span>
          </div>
          <Link
            href="https://www.linkedin.com/in/thotsem-jajo-30909a244/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex justify-center mt-4 text-gray-600"
          >
            @sem
          </Link>
        </div>
      </div>
    </div>
  );
}
