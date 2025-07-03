import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { countryCodeToFlagImg } from '../utils/country';

interface Presence {
  user_id: string;
  username: string;
  country: string;
  last_active: string;
}

export default function ActiveUsers() {
  const [users, setUsers] = useState<Presence[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      const { data } = await supabase
        .from('presence')
        .select('*');
      if (data) setUsers(data);
    }
    fetchUsers();

    const subscription = supabase
      .channel('public:presence')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presence' }, () => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-start px-4 py-2 bg-gray-900/80 rounded-t-xl border-b border-gray-800 mb-2">
      <div className="text-xs text-gray-400 mb-1 font-semibold tracking-wide">
        {users.length} Active User{users.length !== 1 ? 's' : ''}
      </div>
      <div className="flex flex-wrap gap-3">
        {users.map(user => (
          <div key={user.user_id} className="flex items-center gap-1 bg-gray-800/80 px-2 py-1 rounded shadow text-xs">
            <img
              src={countryCodeToFlagImg(user.country, 20)}
              alt={user.country}
              className="w-5 h-5 rounded-sm border border-gray-700 bg-white object-cover"
              style={{ minWidth: 20 }}
              onError={e => { e.currentTarget.src = 'https://flagcdn.com/w20/un.png'; }}
            />
            <span className="font-semibold text-blue-300">{user.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 