$TTL			1d	; default ttl
emp1.com.               	IN    SOA 	dnsemp1.emp1.com.  root.dnsemp1.emp1.com. (
                        			2009120901 ; serial
                        			8h ; refresh
                        			4h ; retry
                        			1000h ; expire
                        			20m ; negative cache ttl
                        			)

emp1.com.			IN	NS	dnsemp1.emp1.com.
dnsemp1.emp1.com.		IN	A	12.0.0.10
pc1.emp1.com.		1s	IN	A	12.0.0.100
